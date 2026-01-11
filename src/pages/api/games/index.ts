import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllGames, seedDefaultGames } from '@/db/game';

/**
 * GET /api/games - Get all available games
 * Also seeds default games if none exist
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure default games exist
    await seedDefaultGames();
    
    const games = await getAllGames();
    
    return res.status(200).json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
