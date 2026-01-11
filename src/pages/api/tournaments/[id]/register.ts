import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  registerParticipant,
  isUserRegistered,
  getParticipantCount,
  getUserParticipant,
  withdrawParticipant,
  createTeam,
  addTeamMember,
  getTeamMembers,
  updateTeamComplete,
  getUserTeamInTournament,
} from '@/db/tournament';

/**
 * POST /api/tournaments/[id]/register - Register for a tournament
 * Body for solo games: {} (empty)
 * Body for team games (create team): { teamName: string }
 * Body for team games (join team): { teamId: string }
 * 
 * DELETE /api/tournaments/[id]/register - Withdraw from tournament
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  if (req.method === 'POST') {
    return handlePost(req, res, id);
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
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

    // Check if registration is open
    if (tournament.status !== 'registration' && tournament.status !== 'ready') {
      return res.status(400).json({
        error: 'Registration is not currently open for this tournament',
      });
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    const game = await getGameById(tournament.gameId);
    if (!game) {
      return res.status(500).json({ error: 'Game not found' });
    }

    const { teamName, teamId } = req.body as {
      teamName?: string;
      teamId?: string;
    };

    // Handle team-based games (like Euchre)
    if (game.isTeamGame) {
      return handleTeamRegistration(req, res, tournament, game, user, teamName, teamId);
    }

    // Handle solo registration
    const alreadyRegistered = await isUserRegistered(tournamentId, user.id);
    if (alreadyRegistered) {
      return res.status(400).json({
        error: 'You are already registered for this tournament',
      });
    }

    const participant = await registerParticipant(tournamentId, user.id);

    console.log('✅ Player registered:', {
      tournamentId,
      participantId: participant.id,
      userId: user.id,
      status: participant.status,
    });

    return res.status(201).json({
      success: true,
      participant,
      isWaitlisted: participant.status === 'waitlist',
    });
  } catch (error) {
    console.error('Error registering for tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTeamRegistration(
  req: NextApiRequest,
  res: NextApiResponse,
  tournament: Awaited<ReturnType<typeof getTournamentById>>,
  game: Awaited<ReturnType<typeof getGameById>>,
  user: Awaited<ReturnType<typeof getUserById>>,
  teamName?: string,
  teamId?: string
) {
  if (!tournament || !game || !user) {
    return res.status(500).json({ error: 'Invalid state' });
  }

  // Check if user is already on a team in this tournament
  const existingTeam = await getUserTeamInTournament(tournament.id, user.id);
  if (existingTeam) {
    return res.status(400).json({
      error: 'You are already on a team in this tournament',
      team: existingTeam,
    });
  }

  // Creating a new team
  if (teamName) {
    const team = await createTeam(tournament.id, teamName, user.id);

    console.log('✅ Team created:', {
      tournamentId: tournament.id,
      teamId: team.id,
      teamName,
      captainId: user.id,
    });

    return res.status(201).json({
      success: true,
      team,
      message: `Team "${teamName}" created. Waiting for teammate to join.`,
    });
  }

  // Joining an existing team
  if (teamId) {
    // Import the getTeamById function
    const { getTeamById } = await import('@/db/tournament');
    const team = await getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.tournamentId !== tournament.id) {
      return res.status(400).json({ error: 'Team is not in this tournament' });
    }

    if (team.isComplete) {
      return res.status(400).json({ error: 'Team is already full' });
    }

    // Add member to team
    await addTeamMember(teamId, user.id);

    // Check if team is now complete
    const members = await getTeamMembers(teamId);
    const isNowComplete = members.length >= game.playersPerTeam;

    if (isNowComplete) {
      await updateTeamComplete(teamId, true);

      // Register the complete team as a participant
      const participant = await registerParticipant(tournament.id, undefined, teamId);

      console.log('✅ Team completed and registered:', {
        tournamentId: tournament.id,
        teamId,
        participantId: participant.id,
      });

      return res.status(200).json({
        success: true,
        team: { ...team, isComplete: true },
        participant,
        message: 'Team is now complete and registered!',
      });
    }

    console.log('✅ Joined team:', {
      tournamentId: tournament.id,
      teamId,
      userId: user.id,
    });

    return res.status(200).json({
      success: true,
      team,
      message: `Joined team "${team.name}". Waiting for more teammates.`,
    });
  }

  return res.status(400).json({
    error: 'For team games, provide either teamName (to create) or teamId (to join)',
  });
}

async function handleDelete(
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

    // Check if tournament is in a state where withdrawal is allowed
    if (tournament.status === 'in_progress') {
      return res.status(400).json({
        error: 'Cannot withdraw from a tournament that has already started',
      });
    }

    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        error: 'Tournament is already finished',
      });
    }

    // Find user's participant record
    const participant = await getUserParticipant(tournamentId, user.id);
    if (!participant) {
      return res.status(404).json({
        error: 'You are not registered for this tournament',
      });
    }

    // Withdraw the participant
    await withdrawParticipant(participant.id);

    console.log('✅ Player withdrawn:', {
      tournamentId,
      participantId: participant.id,
      userId: user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully withdrawn from tournament',
    });
  } catch (error) {
    console.error('Error withdrawing from tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
