import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, canCreateTournament } from '@/db/user';
import { getTournamentById, updateTournament, isUserTournamentOrganizer } from '@/db/tournament';
import { getGameById } from '@/db/game';

const RENAISSANCE_EVENTS_API_URL = process.env.RENAISSANCE_EVENTS_API_URL || 'http://localhost:3002';

/**
 * POST /api/tournaments/[id]/publish-event
 * Publish or update a tournament as an event in renaissance-events
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid tournament ID' });
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

    // Get the tournament
    const tournament = await getTournamentById(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if user is an organizer of this tournament
    const isOrganizer = await isUserTournamentOrganizer(id, user.id);
    if (!isOrganizer && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to publish this tournament' });
    }

    // Get the game for additional context
    const game = await getGameById(tournament.gameId);

    // Build the event data to send to renaissance-events
    const eventData = {
      name: tournament.name,
      location: tournament.location || 'TBD',
      startTime: tournament.startTime?.toISOString() || new Date().toISOString(),
      endTime: tournament.endTime?.toISOString() || tournament.startTime?.toISOString() || new Date().toISOString(),
      imageUrl: '', // Tournaments don't have images by default
      metadata: {
        description: tournament.description || `${game?.name || 'Game'} tournament`,
        tournamentId: tournament.id,
        gameType: game?.type,
        gameName: game?.name,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        maxParticipants: tournament.maxParticipants,
        status: tournament.status,
      },
      tags: game ? [game.type, 'tournament', 'games'] : ['tournament', 'games'],
      eventType: 'renaissance',
      source: 'renaissance-games',
      sourceId: tournament.id,
    };

    let publishedEventId: number;

    if (tournament.publishedEventId) {
      // Update existing event
      const response = await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/events/${tournament.publishedEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update event' }));
        return res.status(response.status).json({ 
          error: errorData.error || 'Failed to update event in renaissance-events' 
        });
      }

      const updatedEvent = await response.json();
      publishedEventId = updatedEvent.id;
    } else {
      // Create new event
      const response = await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create event' }));
        return res.status(response.status).json({ 
          error: errorData.error || 'Failed to create event in renaissance-events' 
        });
      }

      const newEvent = await response.json();
      publishedEventId = newEvent.id;

      // Save the published event ID to the tournament
      await updateTournament(id, { publishedEventId });
    }

    // Get the updated tournament
    const updatedTournament = await getTournamentById(id);

    return res.status(200).json({
      success: true,
      tournament: updatedTournament,
      publishedEventId,
      message: tournament.publishedEventId ? 'Event updated in renaissance-events' : 'Event published to renaissance-events',
    });
  } catch (error) {
    console.error('Error publishing tournament to renaissance-events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
