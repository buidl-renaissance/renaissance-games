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
  getTeamMembers,
  isUserTournamentOrganizer,
} from '@/db/tournament';

const RENAISSANCE_EVENTS_API_URL = process.env.RENAISSANCE_EVENTS_API_URL || 'http://localhost:3002';

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
    const rawParticipants = await getRegisteredParticipants(tournamentId);
    const waitlist = await getWaitlistParticipants(tournamentId);
    
    // Fetch user details for each participant
    const participants = await Promise.all(
      rawParticipants.map(async (participant) => {
        if (participant.userId) {
          const user = await getUserById(participant.userId);
          return {
            ...participant,
            user: user ? {
              displayName: user.displayName,
              username: user.username,
              pfpUrl: user.pfpUrl,
            } : null,
          };
        }
        return participant;
      })
    );
    
    // For team games, get teams with their members
    let teams = null;
    let participantCount = 0;
    
    if (game?.isTeamGame) {
      const rawTeams = await getTeamsByTournament(tournamentId);
      // Fetch members for each team with user details
      teams = await Promise.all(
        rawTeams.map(async (team) => {
          const members = await getTeamMembers(team.id);
          const membersWithUsers = await Promise.all(
            members.map(async (member) => {
              const memberUser = await getUserById(member.userId);
              return {
                userId: member.userId,
                user: memberUser ? {
                  id: memberUser.id,
                  displayName: memberUser.displayName,
                  username: memberUser.username,
                } : null,
              };
            })
          );
          return {
            ...team,
            members: membersWithUsers,
          };
        })
      );
      // For team games, count all team members as participants
      participantCount = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    } else {
      // For solo games, count registered participants
      participantCount = await getParticipantCount(tournamentId);
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
    const canEdit = await isUserTournamentOrganizer(tournamentId, user.id) || isOrganizer(user);
    if (!canEdit) {
      return res.status(403).json({
        error: 'Only tournament organizers can update this tournament',
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

    // Validate that start time is at or after registration deadline
    const effectiveStartTime = updates.startTime as Date | undefined || tournament.startTime;
    const effectiveRegDeadline = updates.registrationDeadline as Date | undefined || tournament.registrationDeadline;
    if (effectiveStartTime && effectiveRegDeadline && effectiveStartTime < effectiveRegDeadline) {
      return res.status(400).json({
        error: 'Tournament start time must be at or after the registration deadline',
      });
    }

    const updatedTournament = await updateTournament(tournamentId, updates);

    console.log('✅ Tournament updated:', {
      id: tournamentId,
      updates: Object.keys(updates),
    });

    // Sync changes to Renaissance Events if tournament is published
    if (updatedTournament?.publishedEventId) {
      try {
        const game = await getGameById(updatedTournament.gameId);
        
        const eventData = {
          name: updatedTournament.name,
          location: updatedTournament.location || 'TBD',
          startTime: updatedTournament.startTime?.toISOString() || new Date().toISOString(),
          endTime: updatedTournament.endTime?.toISOString() || updatedTournament.startTime?.toISOString() || new Date().toISOString(),
          imageUrl: updatedTournament.imageUrl || '',
          metadata: {
            description: updatedTournament.description || `${game?.name || 'Game'} tournament`,
            tournamentId: updatedTournament.id,
            gameType: game?.type,
            gameName: game?.name,
            entryFee: updatedTournament.entryFee,
            prizePool: updatedTournament.prizePool,
            maxParticipants: updatedTournament.maxParticipants,
            status: updatedTournament.status,
          },
          tags: game ? [game.type, 'tournament', 'games'] : ['tournament', 'games'],
          eventType: 'renaissance',
          source: 'renaissance-games',
          sourceId: updatedTournament.id,
        };

        await fetch(`${RENAISSANCE_EVENTS_API_URL}/api/events/${updatedTournament.publishedEventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
        
        console.log('✅ Synced tournament changes to Renaissance Events');
      } catch (syncError) {
        console.error('Failed to sync to Renaissance Events:', syncError);
        // Don't fail the update if sync fails
      }
    }

    return res.status(200).json({
      success: true,
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
