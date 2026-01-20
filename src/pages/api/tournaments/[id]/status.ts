import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  updateTournamentStatus,
  updateTournament,
  openRegistration,
  cancelTournament,
  startTournament,
  closeTournament,
  canStartTournament,
  isUserTournamentOrganizer,
  TournamentStatus,
} from '@/db/tournament';

const RENAISSANCE_EVENTS_API_URL = process.env.RENAISSANCE_EVENTS_API_URL || 'http://localhost:3002';

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
    const canManage = await isUserTournamentOrganizer(id, user.id) || isOrganizer(user);
    if (!canManage) {
      return res.status(403).json({
        error: 'Only tournament organizers can change the status',
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
        
        // Publish to Renaissance Events when registration opens
        try {
          const eventData = {
            name: tournament.name,
            location: tournament.location || 'TBD',
            startTime: tournament.startTime?.toISOString() || new Date().toISOString(),
            endTime: tournament.endTime?.toISOString() || tournament.startTime?.toISOString() || new Date().toISOString(),
            imageUrl: tournament.imageUrl || '',
            metadata: {
              description: tournament.description || `${game.name} tournament`,
              tournamentId: tournament.id,
              gameType: game.type,
              gameName: game.name,
              entryFee: tournament.entryFee,
              prizePool: tournament.prizePool,
              maxParticipants: tournament.maxParticipants,
              status: 'registration',
            },
            tags: [game.type, 'tournament', 'games'],
            eventType: 'renaissance',
            source: 'renaissance-games',
            sourceId: tournament.id,
          };

          if (tournament.publishedEventId) {
            // Update existing event
            await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/events/${tournament.publishedEventId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            });
          } else {
            // Create new event
            const response = await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/events`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            });

            if (response.ok) {
              const newEvent = await response.json();
              await updateTournament(id, { publishedEventId: newEvent.id });
              updatedTournament = await getTournamentById(id);
            }
          }
          console.log('✅ Published tournament to Renaissance Events');
        } catch (publishError) {
          console.error('Failed to publish to Renaissance Events:', publishError);
          // Don't fail the status update if publishing fails
        }
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
