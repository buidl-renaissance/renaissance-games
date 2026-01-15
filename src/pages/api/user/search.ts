import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { like, or, sql } from 'drizzle-orm';
import { getUserById } from '@/db/user';

/**
 * GET /api/user/search?q=query - Search for users by username or display name
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

    const { q } = req.query;
    
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

    return res.status(200).json({
      success: true,
      users: results,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
