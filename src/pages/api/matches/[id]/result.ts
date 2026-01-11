import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getTournamentById, getParticipantById } from '@/db/tournament';
import {
  getMatchById,
  submitMatchResult,
  confirmMatchResult,
  getMatchResults,
  disputeMatch,
  resolveDispute,
} from '@/db/match';

/**
 * GET /api/matches/[id]/result - Get match results/submissions
 * POST /api/matches/[id]/result - Submit match result
 * Body: { winnerId, participant1Score, participant2Score }
 * 
 * PATCH /api/matches/[id]/result - Confirm or dispute result
 * Body: { action: 'confirm' | 'dispute' | 'resolve', winnerId?, participant1Score?, participant2Score? }
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

  if (req.method === 'POST') {
    return handlePost(req, res, id);
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

    const results = await getMatchResults(matchId);

    return res.status(200).json({
      success: true,
      match,
      results,
    });
  } catch (error) {
    console.error('Error fetching match results:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(
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

    // Check if match is in a state where results can be submitted
    if (match.status !== 'in_progress' && match.status !== 'ready') {
      return res.status(400).json({
        error: `Cannot submit result for match in ${match.status} status`,
      });
    }

    const tournament = await getTournamentById(match.tournamentId);
    if (!tournament) {
      return res.status(500).json({ error: 'Tournament not found' });
    }

    const { winnerId, participant1Score, participant2Score } = req.body as {
      winnerId: string;
      participant1Score: number;
      participant2Score: number;
    };

    if (!winnerId || participant1Score === undefined || participant2Score === undefined) {
      return res.status(400).json({
        error: 'winnerId, participant1Score, and participant2Score are required',
      });
    }

    // Validate winner is a participant in the match
    if (winnerId !== match.participant1Id && winnerId !== match.participant2Id) {
      return res.status(400).json({
        error: 'Winner must be one of the match participants',
      });
    }

    // Check if user is involved in the match or is the organizer
    const isOrganizerOverride = tournament.organizerId === user.id || isOrganizer(user);
    
    // For non-organizers, verify they're a participant
    if (!isOrganizerOverride) {
      const isParticipant = await checkUserIsParticipant(match, user.id);
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Only match participants or organizers can submit results',
        });
      }
    }

    const result = await submitMatchResult(
      matchId,
      user.id,
      winnerId,
      participant1Score,
      participant2Score,
      isOrganizerOverride
    );

    console.log('✅ Match result submitted:', {
      matchId,
      submittedBy: user.id,
      winnerId,
      isOrganizerOverride,
    });

    return res.status(201).json({
      success: true,
      result,
      message: isOrganizerOverride
        ? 'Result confirmed by organizer'
        : 'Result submitted, awaiting opponent confirmation',
    });
  } catch (error) {
    console.error('Error submitting match result:', error);
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

    const { action, winnerId, participant1Score, participant2Score } = req.body as {
      action: 'confirm' | 'dispute' | 'resolve';
      winnerId?: string;
      participant1Score?: number;
      participant2Score?: number;
    };

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    switch (action) {
      case 'confirm': {
        if (match.status !== 'awaiting_confirmation') {
          return res.status(400).json({
            error: 'Match is not awaiting confirmation',
          });
        }

        // Verify user is the opponent
        const isParticipant = await checkUserIsParticipant(match, user.id);
        if (!isParticipant && tournament.organizerId !== user.id) {
          return res.status(403).json({
            error: 'Only match participants or organizers can confirm results',
          });
        }

        const confirmed = await confirmMatchResult(matchId, user.id);
        if (!confirmed) {
          return res.status(400).json({ error: 'Failed to confirm result' });
        }

        console.log('✅ Match result confirmed:', {
          matchId,
          confirmedBy: user.id,
          winnerId: confirmed.match.winnerId,
        });

        return res.status(200).json({
          success: true,
          match: confirmed.match,
          result: confirmed.result,
          message: 'Result confirmed, match completed',
        });
      }

      case 'dispute': {
        if (match.status !== 'awaiting_confirmation') {
          return res.status(400).json({
            error: 'Can only dispute matches awaiting confirmation',
          });
        }

        const isParticipant = await checkUserIsParticipant(match, user.id);
        if (!isParticipant) {
          return res.status(403).json({
            error: 'Only match participants can dispute results',
          });
        }

        const disputedMatch = await disputeMatch(matchId);

        console.log('⚠️ Match disputed:', {
          matchId,
          disputedBy: user.id,
        });

        return res.status(200).json({
          success: true,
          match: disputedMatch,
          message: 'Match result disputed, organizer review required',
        });
      }

      case 'resolve': {
        // Only organizers can resolve disputes
        if (tournament.organizerId !== user.id && !isOrganizer(user)) {
          return res.status(403).json({
            error: 'Only organizers can resolve disputes',
          });
        }

        if (match.status !== 'disputed') {
          return res.status(400).json({
            error: 'Can only resolve disputed matches',
          });
        }

        if (!winnerId || participant1Score === undefined || participant2Score === undefined) {
          return res.status(400).json({
            error: 'winnerId, participant1Score, and participant2Score are required to resolve',
          });
        }

        const resolvedMatch = await resolveDispute(
          matchId,
          winnerId,
          participant1Score,
          participant2Score
        );

        console.log('✅ Dispute resolved:', {
          matchId,
          resolvedBy: user.id,
          winnerId,
        });

        return res.status(200).json({
          success: true,
          match: resolvedMatch,
          message: 'Dispute resolved by organizer',
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling match result action:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

async function checkUserIsParticipant(
  match: Awaited<ReturnType<typeof getMatchById>>,
  userId: string
): Promise<boolean> {
  if (!match) return false;

  // Get participant details
  if (match.participant1Id) {
    const p1 = await getParticipantById(match.participant1Id);
    if (p1?.userId === userId) return true;
  }

  if (match.participant2Id) {
    const p2 = await getParticipantById(match.participant2Id);
    if (p2?.userId === userId) return true;
  }

  // For team games, would need to check team membership
  // This is simplified for now

  return false;
}
