import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getTournamentById, getParticipantById } from '@/db/tournament';
import { getMatchById, updateMatch, startMatch } from '@/db/match';

/**
 * GET /api/matches/[id] - Get match details
 * PATCH /api/matches/[id] - Update match (organizer only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Match ID is required' });
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
  matchId: string
) {
  try {
    const match = await getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get participant details
    let participant1 = null;
    let participant2 = null;

    if (match.participant1Id) {
      participant1 = await getParticipantById(match.participant1Id);
    }
    if (match.participant2Id) {
      participant2 = await getParticipantById(match.participant2Id);
    }

    return res.status(200).json({
      success: true,
      match,
      participant1,
      participant2,
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  matchId: string
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

    const match = await getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const tournament = await getTournamentById(match.tournamentId);
    if (!tournament) {
      return res.status(500).json({ error: 'Tournament not found' });
    }

    // Check if user is the organizer
    if (tournament.organizerId !== user.id && !isOrganizer(user)) {
      return res.status(403).json({
        error: 'Only the tournament organizer can update matches',
      });
    }

    const { action, scheduledTime } = req.body as {
      action?: 'start';
      scheduledTime?: string;
    };

    // Handle start action
    if (action === 'start') {
      if (match.status !== 'ready') {
        return res.status(400).json({
          error: 'Match is not ready to start',
        });
      }

      const startedMatch = await startMatch(matchId);

      console.log('✅ Match started:', {
        matchId,
        startedBy: user.id,
      });

      return res.status(200).json({
        success: true,
        match: startedMatch,
        message: 'Match started',
      });
    }

    // Handle schedule update
    if (scheduledTime) {
      const updatedMatch = await updateMatch(matchId, {
        scheduledTime: new Date(scheduledTime),
      });

      return res.status(200).json({
        success: true,
        match: updatedMatch,
        message: 'Match scheduled',
      });
    }

    return res.status(400).json({ error: 'No valid update provided' });
  } catch (error) {
    console.error('Error updating match:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
