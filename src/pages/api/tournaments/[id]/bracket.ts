import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  getRegisteredParticipants,
  updateTournament,
  isUserTournamentOrganizer,
} from '@/db/tournament';
import {
  getMatchesByTournament,
  generateAndSaveBracket,
} from '@/db/match';
import { getBracketVisualization } from '@/lib/bracket';

/**
 * GET /api/tournaments/[id]/bracket - Get bracket for a tournament
 * POST /api/tournaments/[id]/bracket - Generate bracket (organizer only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, id);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  tournamentId: string
) {
  try {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const matches = await getMatchesByTournament(tournamentId);

    if (matches.length === 0) {
      return res.status(200).json({
        success: true,
        bracket: null,
        message: 'Bracket has not been generated yet',
      });
    }

    const visualization = getBracketVisualization(matches);

    return res.status(200).json({
      success: true,
      bracket: visualization,
      matches,
      eliminationType: tournament.eliminationType,
    });
  } catch (error) {
    console.error('Error fetching bracket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  tournamentId: string
) {
  try {
    // Get user from session cookie
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getUserById(sessionCookie);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if user is the organizer or an admin
    const canManage = await isUserTournamentOrganizer(tournamentId, user.id) || isOrganizer(user);
    if (!canManage) {
      return res.status(403).json({
        error: 'Only tournament organizers can generate the bracket',
      });
    }

    // Check tournament status
    if (tournament.status !== 'registration' && tournament.status !== 'ready') {
      return res.status(400).json({
        error: 'Bracket can only be generated when tournament is in registration or ready status',
      });
    }

    // Check if bracket already exists
    const existingMatches = await getMatchesByTournament(tournamentId);
    if (existingMatches.length > 0) {
      return res.status(400).json({
        error: 'Bracket has already been generated',
      });
    }

    const game = await getGameById(tournament.gameId);
    if (!game) {
      return res.status(500).json({ error: 'Game not found' });
    }

    // Get registered participants
    const participants = await getRegisteredParticipants(tournamentId);

    if (participants.length < tournament.minParticipants) {
      return res.status(400).json({
        error: `Need at least ${tournament.minParticipants} participants (have ${participants.length})`,
      });
    }

    // Determine elimination type based on participant count
    const eliminationType = game.eliminationRules.doubleEliminationMax >= participants.length
      ? 'double'
      : 'single';

    // Generate bracket
    const bracketParticipants = participants.map(p => ({
      id: p.id,
      seed: p.seed,
    }));

    const matches = await generateAndSaveBracket(
      tournamentId,
      bracketParticipants,
      eliminationType
    );

    // Update tournament with elimination type and set to ready status
    await updateTournament(tournamentId, {
      eliminationType,
      status: 'ready',
    });

    const visualization = getBracketVisualization(matches);

    console.log('✅ Bracket generated:', {
      tournamentId,
      participantCount: participants.length,
      eliminationType,
      matchCount: matches.length,
    });

    return res.status(201).json({
      success: true,
      bracket: visualization,
      matches,
      eliminationType,
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
