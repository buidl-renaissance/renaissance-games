import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, isOrganizer } from '@/db/user';
import { getGameById } from '@/db/game';
import {
  getTournamentById,
  getTeamsByTournament,
  getTeamMembers,
  createTeam,
  addTeamMember,
  updateTeamComplete,
  registerParticipant,
} from '@/db/tournament';

/**
 * GET /api/teams?tournamentId=xxx - Get teams for a tournament
 * POST /api/teams - Create a team with members (organizer pairing)
 * Body: { tournamentId, teamName, memberIds: string[] }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tournamentId } = req.query;

    if (!tournamentId || typeof tournamentId !== 'string') {
      return res.status(400).json({ error: 'tournamentId is required' });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const teams = await getTeamsByTournament(tournamentId);

    // Get members for each team with user details
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await getTeamMembers(team.id);
        // Fetch user details for each member
        const membersWithUsers = await Promise.all(
          members.map(async (member) => {
            const user = await getUserById(member.userId);
            return {
              ...member,
              user: user ? {
                id: user.id,
                displayName: user.displayName,
                username: user.username,
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

    return res.status(200).json({
      success: true,
      teams: teamsWithMembers,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
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

    // Only organizers can create teams with assigned members
    if (!isOrganizer(user)) {
      return res.status(403).json({
        error: 'Only organizers can manually create teams with members',
      });
    }

    const { tournamentId, teamName, memberIds } = req.body as {
      tournamentId: string;
      teamName: string;
      memberIds: string[];
    };

    if (!tournamentId || !teamName || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        error: 'tournamentId, teamName, and memberIds are required',
      });
    }

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if user is the tournament organizer or admin
    if (tournament.organizerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only the tournament organizer can create teams',
      });
    }

    const game = await getGameById(tournament.gameId);
    if (!game) {
      return res.status(500).json({ error: 'Game not found' });
    }

    if (!game.isTeamGame) {
      return res.status(400).json({
        error: 'This tournament does not support teams',
      });
    }

    if (memberIds.length !== game.playersPerTeam) {
      return res.status(400).json({
        error: `Team must have exactly ${game.playersPerTeam} members`,
      });
    }

    // Verify all members exist
    const memberPromises = memberIds.map((id) => getUserById(id));
    const members = await Promise.all(memberPromises);
    
    const missingMembers = memberIds.filter((id, index) => !members[index]);
    if (missingMembers.length > 0) {
      return res.status(400).json({
        error: `Users not found: ${missingMembers.join(', ')}`,
      });
    }

    // Create team with first member as captain
    const team = await createTeam(tournamentId, teamName, memberIds[0]);

    // Add remaining members
    for (let i = 1; i < memberIds.length; i++) {
      await addTeamMember(team.id, memberIds[i]);
    }

    // Mark team as complete
    await updateTeamComplete(team.id, true);

    // Register the team as a participant
    const participant = await registerParticipant(tournamentId, undefined, team.id);

    console.log('✅ Team created by organizer:', {
      tournamentId,
      teamId: team.id,
      teamName,
      memberIds,
      participantId: participant.id,
    });

    return res.status(201).json({
      success: true,
      team: {
        ...team,
        isComplete: true,
        members: memberIds.map((userId) => ({ userId })),
      },
      participant,
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
