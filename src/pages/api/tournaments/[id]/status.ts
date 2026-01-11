import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  updateTournamentStatus,
  openRegistration,
  cancelTournament,
  startTournament,
  closeTournament,
  canStartTournament,
  TournamentStatus,
} from '@/db/tournament';

/**
 * PATCH /api/tournaments/[id]/status - Update tournament status
 * Body: { status: TournamentStatus }
 * 
 * Valid status transitions:
 *   draft -> registration
 *   registration -> ready (when min participants reached)
 *   ready -> in_progress (when started)
 *   in_progress -> completed
 *   any -> cancelled
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

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

    const tournament = await getTournamentById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if user is the organizer or an admin
    if (tournament.organizerId !== user.id && !isOrganizer(user)) {
      return res.status(403).json({
        error: 'Only the tournament organizer can change the status',
      });
    }

    const { status } = req.body as { status: TournamentStatus };

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Get game for validation
    const game = await getGameById(tournament.gameId);
    if (!game) {
      return res.status(500).json({ error: 'Game not found' });
    }

    // Validate status transition
    const validationResult = validateStatusTransition(tournament.status, status);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.reason });
    }

    let updatedTournament;

    // Handle specific status changes
    switch (status) {
      case 'registration':
        updatedTournament = await openRegistration(id);
        break;

      case 'in_progress':
        // Verify tournament can start
        const canStart = await canStartTournament(tournament, game);
        if (!canStart.canStart) {
          return res.status(400).json({ error: canStart.reason });
        }
        updatedTournament = await startTournament(id, game);
        break;

      case 'completed':
        updatedTournament = await closeTournament(id);
        break;

      case 'cancelled':
        updatedTournament = await cancelTournament(id);
        break;

      default:
        updatedTournament = await updateTournamentStatus(id, status);
    }

    console.log('✅ Tournament status changed:', {
      id,
      from: tournament.status,
      to: status,
    });

    return res.status(200).json({
      success: true,
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error('Error updating tournament status:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

function validateStatusTransition(
  current: TournamentStatus,
  target: TournamentStatus
): { valid: boolean; reason?: string } {
  // Cancelled can be set from any state except completed
  if (target === 'cancelled') {
    if (current === 'completed') {
      return { valid: false, reason: 'Cannot cancel a completed tournament' };
    }
    return { valid: true };
  }

  // Cannot change from completed or cancelled
  if (current === 'completed' || current === 'cancelled') {
    return {
      valid: false,
      reason: `Cannot change status from ${current}`,
    };
  }

  // Valid forward transitions
  const validTransitions: Record<TournamentStatus, TournamentStatus[]> = {
    draft: ['registration'],
    registration: ['ready', 'in_progress'],
    ready: ['in_progress', 'registration'],
    in_progress: ['completed'],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[current].includes(target)) {
    return {
      valid: false,
      reason: `Cannot transition from ${current} to ${target}`,
    };
  }

  return { valid: true };
}
