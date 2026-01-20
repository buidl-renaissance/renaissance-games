import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById } from '@/db/user';
import { seedDefaultGames, getAllGames } from '@/db/game';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import {
  tournamentParticipants,
  teamMembers,
  teams,
  type ParticipantStatus,
} from '@/db/schema';
import {
  getTournamentsByStatus,
  getIndividualParticipantCount,
  Tournament,
} from '@/db/tournament';

// Get all tournament IDs where user is registered (directly or via team)
async function getUserTournamentIds(userId: string): Promise<string[]> {
  // Get tournaments where user is directly registered (excluding withdrawn)
  const directRegistrations = await db
    .select({ tournamentId: tournamentParticipants.tournamentId })
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.userId, userId),
        ne(tournamentParticipants.status, 'withdrawn' as ParticipantStatus)
      )
    );

  // Get teams the user is a member of
  const teamMemberships = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  // Get tournament IDs from teams
  const teamIds = teamMemberships.map(tm => tm.teamId);
  const teamTournamentIds: string[] = [];
  
  if (teamIds.length > 0) {
    for (const teamId of teamIds) {
      // First, get the team's tournament ID directly from the teams table
      const teamRecord = await db
        .select({ tournamentId: teams.tournamentId })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
      
      if (teamRecord.length > 0) {
        // Check if team has a withdrawn participant record
        const withdrawnRecord = await db
          .select({ id: tournamentParticipants.id })
          .from(tournamentParticipants)
          .where(
            and(
              eq(tournamentParticipants.teamId, teamId),
              eq(tournamentParticipants.status, 'withdrawn' as ParticipantStatus)
            )
          )
          .limit(1);
        
        // Only include if not withdrawn (or if no participant record exists yet - incomplete team)
        if (withdrawnRecord.length === 0) {
          teamTournamentIds.push(teamRecord[0].tournamentId);
        }
      }
    }
  }

  // Combine and deduplicate
  const allTournamentIds = new Set([
    ...directRegistrations.map(r => r.tournamentId),
    ...teamTournamentIds,
  ]);

  return Array.from(allTournamentIds);
}

interface TournamentWithCount extends Tournament {
  participantCount: number;
  isRegistered: boolean;
}

/**
 * GET /api/dashboard - Get dashboard data for authenticated user
 * Returns:
 *   - liveTournaments: In-progress tournaments
 *   - openTournaments: Open for registration tournaments (with isRegistered flag)
 *   - games: All games
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure games are seeded
    await seedDefaultGames();

    // Get user from session
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getUserById(sessionCookie);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user can see draft tournaments
    const canSeeDrafts = user.role === 'admin' || user.role === 'organizer';

    // Fetch all data in parallel
    const [
      registrationTournaments,
      liveTournaments,
      draftTournaments,
      userTournamentIds,
      games,
    ] = await Promise.all([
      getTournamentsByStatus('registration'),
      getTournamentsByStatus('in_progress'),
      canSeeDrafts ? getTournamentsByStatus('draft') : Promise.resolve([]),
      getUserTournamentIds(user.id),
      getAllGames(),
    ]);

    // Add participant count and registration status to tournaments
    const addTournamentInfo = async (tournaments: Tournament[]): Promise<TournamentWithCount[]> => {
      return Promise.all(
        tournaments.map(async (t) => ({
          ...t,
          participantCount: await getIndividualParticipantCount(t.id),
          isRegistered: userTournamentIds.includes(t.id),
        }))
      );
    };

    // Add info to all tournament lists
    const [liveWithCount, openWithCount, draftWithCount] = await Promise.all([
      addTournamentInfo(liveTournaments),
      addTournamentInfo(registrationTournaments),
      addTournamentInfo(draftTournaments),
    ]);

    return res.status(200).json({
      success: true,
      liveTournaments: liveWithCount,
      openTournaments: openWithCount,
      draftTournaments: draftWithCount,
      games,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
