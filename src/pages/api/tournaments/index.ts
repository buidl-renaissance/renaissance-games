import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, canCreateTournament } from '@/db/user';
import { getGameById, seedDefaultGames } from '@/db/game';
import {
  createTournament,
  getAllTournaments,
  getActiveTournaments,
  getTournamentsByOrganizer,
  getTournamentsByStatus,
  getTournamentsUserCanOrganize,
  CreateTournamentInput,
  Tournament,
} from '@/db/tournament';

/**
 * GET /api/tournaments - List tournaments
 * Query params:
 *   - status: 'active' | 'all' (default: 'active')
 *   - organizerId: filter by organizer
 * 
 * POST /api/tournaments - Create a new tournament
 * Body: CreateTournamentInput
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ensure games are seeded
  await seedDefaultGames();

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
    const { status, organizerId } = req.query;

    // Get current user from session (if any)
    const sessionCookie = req.cookies.user_session;
    const currentUser = sessionCookie ? await getUserById(sessionCookie) : null;

    let tournaments: Tournament[];

    if (organizerId && typeof organizerId === 'string') {
      tournaments = await getTournamentsByOrganizer(organizerId);
    } else if (status === 'all') {
      tournaments = await getAllTournaments();
    } else if (status === 'draft' || status === 'registration' || status === 'in_progress' || status === 'completed' || status === 'cancelled' || status === 'ready') {
      // Filter by specific status
      tournaments = await getTournamentsByStatus(status as 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled' | 'ready');
    } else {
      // Default: active tournaments (registration, ready, in_progress)
      tournaments = await getActiveTournaments();
    }

    // Filter draft tournaments - only show to organizers who have access
    if (status === 'draft' && currentUser) {
      // Get tournament IDs user can organize
      const organizableTournamentIds = await getTournamentsUserCanOrganize(currentUser.id);
      
      // Admin can see all drafts
      if (currentUser.role !== 'admin') {
        tournaments = tournaments.filter(t => organizableTournamentIds.includes(t.id));
      }
    } else if (status === 'draft' && !currentUser) {
      // Non-authenticated users can't see any drafts
      tournaments = [];
    }

    return res.status(200).json({
      success: true,
      tournaments,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
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

    // Check if user can create tournaments
    if (!canCreateTournament(user)) {
      return res.status(403).json({
        error: 'You do not have permission to create tournaments',
      });
    }

    const {
      gameId,
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
      gameId: string;
      name: string;
      description?: string;
      minParticipants: number;
      maxParticipants: number;
      entryFee?: number;
      prizePool?: number;
      prizeDistribution?: Record<string, number>;
      bestOf?: number;
      registrationDeadline?: string;
      startTime?: string;
      location?: string;
    };

    // Validate required fields
    if (!gameId || !name || !minParticipants || !maxParticipants) {
      return res.status(400).json({
        error: 'Missing required fields: gameId, name, minParticipants, maxParticipants',
      });
    }

    // Validate game exists
    const game = await getGameById(gameId);
    if (!game) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    // Validate participant limits
    if (minParticipants < game.minPlayers) {
      return res.status(400).json({
        error: `Minimum participants must be at least ${game.minPlayers} for ${game.name}`,
      });
    }

    if (maxParticipants > game.maxPlayers) {
      return res.status(400).json({
        error: `Maximum participants cannot exceed ${game.maxPlayers} for ${game.name}`,
      });
    }

    if (minParticipants > maxParticipants) {
      return res.status(400).json({
        error: 'Minimum participants cannot exceed maximum participants',
      });
    }

    const input: CreateTournamentInput = {
      gameId,
      organizerId: user.id,
      name,
      description,
      minParticipants,
      maxParticipants,
      entryFee,
      prizePool,
      prizeDistribution,
      bestOf,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      location,
    };

    const tournament = await createTournament(input);

    console.log('✅ Tournament created:', {
      id: tournament.id,
      name: tournament.name,
      organizerId: user.id,
    });

    return res.status(201).json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
