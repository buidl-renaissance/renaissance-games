import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, getUserByUsername } from '@/db/user';
import {
  getTournamentById,
  getTournamentOrganizers,
  addTournamentOrganizer,
  removeTournamentOrganizer,
  isUserTournamentOrganizer,
} from '@/db/tournament';

/**
 * GET /api/tournaments/[id]/organizers - Get organizers for a tournament
 * POST /api/tournaments/[id]/organizers - Add an organizer
 * DELETE /api/tournaments/[id]/organizers - Remove an organizer
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: tournamentId } = req.query;

  if (!tournamentId || typeof tournamentId !== 'string') {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, tournamentId, tournament);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, tournamentId, tournament);
  }

  if (req.method === 'DELETE') {
    return handleDelete(req, res, tournamentId, tournament);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  tournamentId: string,
  tournament: Awaited<ReturnType<typeof getTournamentById>>
) {
  try {
    const organizers = await getTournamentOrganizers(tournamentId);

    // Get user details for each organizer
    const organizersWithUsers = await Promise.all(
      organizers.map(async (org) => {
        const user = await getUserById(org.userId);
        return {
          ...org,
          user: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
          } : null,
        };
      })
    );

    // Include primary organizer
    const primaryOrganizer = await getUserById(tournament!.organizerId);

    return res.status(200).json({
      success: true,
      primaryOrganizer: primaryOrganizer ? {
        id: primaryOrganizer.id,
        username: primaryOrganizer.username,
        displayName: primaryOrganizer.displayName,
      } : null,
      additionalOrganizers: organizersWithUsers,
    });
  } catch (error) {
    console.error('Error fetching organizers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  tournamentId: string,
  tournament: Awaited<ReturnType<typeof getTournamentById>>
) {
  try {
    // Authenticate user
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await getUserById(sessionCookie);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if current user is an organizer (only organizers can add other organizers)
    const isOrganizer = await isUserTournamentOrganizer(tournamentId, currentUser.id);
    if (!isOrganizer && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only tournament organizers can add other organizers' });
    }

    const { username } = req.body as { username?: string };

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find user by username
    const userToAdd = await getUserByUsername(username);
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found with that username' });
    }

    // Check if user is already an organizer
    const alreadyOrganizer = await isUserTournamentOrganizer(tournamentId, userToAdd.id);
    if (alreadyOrganizer) {
      return res.status(400).json({ error: 'User is already an organizer' });
    }

    // Add as organizer
    const organizer = await addTournamentOrganizer(tournamentId, userToAdd.id);

    console.log('✅ Added tournament organizer:', {
      tournamentId,
      userId: userToAdd.id,
      username: userToAdd.username,
    });

    return res.status(201).json({
      success: true,
      organizer: {
        ...organizer,
        user: {
          id: userToAdd.id,
          username: userToAdd.username,
          displayName: userToAdd.displayName,
        },
      },
    });
  } catch (error) {
    console.error('Error adding organizer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  tournamentId: string,
  tournament: Awaited<ReturnType<typeof getTournamentById>>
) {
  try {
    // Authenticate user
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await getUserById(sessionCookie);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Only primary organizer or admin can remove organizers
    if (tournament!.organizerId !== currentUser.id && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only the primary organizer can remove other organizers' });
    }

    const { userId } = req.body as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Can't remove the primary organizer
    if (userId === tournament!.organizerId) {
      return res.status(400).json({ error: 'Cannot remove the primary organizer' });
    }

    await removeTournamentOrganizer(tournamentId, userId);

    console.log('✅ Removed tournament organizer:', {
      tournamentId,
      userId,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error removing organizer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
