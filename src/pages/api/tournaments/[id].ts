import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  updateTournament,
  getParticipantCount,
  getRegisteredParticipants,
  getWaitlistParticipants,
  getTeamsByTournament,
} from '@/db/tournament';

/**
 * GET /api/tournaments/[id] - Get tournament details
 * PATCH /api/tournaments/[id] - Update tournament (organizer only)
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

  if (req.method === 'PATCH') {
    return handlePatch(req, res, id);
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

    // Get associated data
    const game = await getGameById(tournament.gameId);
    const participantCount = await getParticipantCount(tournamentId);
    const participants = await getRegisteredParticipants(tournamentId);
    const waitlist = await getWaitlistParticipants(tournamentId);
    
    // For team games, get teams
    let teams = null;
    if (game?.isTeamGame) {
      teams = await getTeamsByTournament(tournamentId);
    }

    return res.status(200).json({
      success: true,
      tournament,
      game,
      participantCount,
      participants,
      waitlist,
      teams,
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePatch(
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
    if (tournament.organizerId !== user.id && !isOrganizer(user)) {
      return res.status(403).json({
        error: 'Only the tournament organizer can update this tournament',
      });
    }

    // Don't allow updates to completed/cancelled tournaments
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cannot update a completed or cancelled tournament',
      });
    }

    const {
      name,
      description,
      minParticipants,
      maxParticipants,
      entryFee,
      prizePool,
      prizeDistribution,
      bestOf,
      registrationDeadline,
      startTime,
      location,
    } = req.body as {
      name?: string;
      description?: string;
      minParticipants?: number;
      maxParticipants?: number;
      entryFee?: number;
      prizePool?: number;
      prizeDistribution?: Record<string, number>;
      bestOf?: number;
      registrationDeadline?: string;
      startTime?: string;
      location?: string;
    };

    // Build updates object
    const updates: Record<string, unknown> = {};
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (minParticipants !== undefined) updates.minParticipants = minParticipants;
    if (maxParticipants !== undefined) updates.maxParticipants = maxParticipants;
    if (entryFee !== undefined) updates.entryFee = entryFee;
    if (prizePool !== undefined) updates.prizePool = prizePool;
    if (prizeDistribution !== undefined) updates.prizeDistribution = prizeDistribution;
    if (bestOf !== undefined) updates.bestOf = bestOf;
    if (registrationDeadline !== undefined) {
      updates.registrationDeadline = new Date(registrationDeadline);
    }
    if (startTime !== undefined) {
      updates.startTime = new Date(startTime);
    }
    if (location !== undefined) updates.location = location;

    const updatedTournament = await updateTournament(tournamentId, updates);

    console.log('✅ Tournament updated:', {
      id: tournamentId,
      updates: Object.keys(updates),
    });

    return res.status(200).json({
      success: true,
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
