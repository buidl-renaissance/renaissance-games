import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { or, sql } from 'drizzle-orm';
import { getUserById } from '@/db/user';
import { getUserTeamInTournament } from '@/db/tournament';

/**
 * GET /api/user/search?q=query&tournamentId=xxx - Search for users by username or display name
 * Optional tournamentId includes team info if user is already registered
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await getUserById(sessionCookie);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { q, tournamentId } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(200).json({ users: [] });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    // Search by username or display name (case insensitive)
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        pfpUrl: users.pfpUrl,
      })
      .from(users)
      .where(
        or(
          sql`LOWER(${users.username}) LIKE ${searchTerm}`,
          sql`LOWER(${users.displayName}) LIKE ${searchTerm}`
        )
      )
      .limit(10);

    // If tournamentId is provided, add team info for users already registered
    if (tournamentId && typeof tournamentId === 'string') {
      const usersWithTeamInfo = await Promise.all(
        results.map(async (user) => {
          const existingTeam = await getUserTeamInTournament(tournamentId, user.id);
          return {
            ...user,
            existingTeam: existingTeam ? { id: existingTeam.id, name: existingTeam.name } : null,
          };
        })
      );
      
      // Sort: available users first, then users already on teams
      usersWithTeamInfo.sort((a, b) => {
        if (a.existingTeam && !b.existingTeam) return 1;
        if (!a.existingTeam && b.existingTeam) return -1;
        return 0;
      });

      return res.status(200).json({
        success: true,
        users: usersWithTeamInfo,
      });
    }

    return res.status(200).json({
      success: true,
      users: results,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
