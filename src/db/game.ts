import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { games, GameType, EliminationType } from './schema';

// Game configuration interface
export interface GameConfig {
  id: string;
  type: GameType;
  name: string;
  description: string | null;
  isTeamGame: boolean;
  playersPerTeam: number;
  minPlayers: number;
  maxPlayers: number;
  eliminationRules: EliminationRules;
  createdAt: Date;
}

// Elimination rules structure
export interface EliminationRules {
  // Threshold: if participant count <= doubleEliminationMax, use double elimination
  // otherwise use single elimination
  doubleEliminationMax: number;
}

// Default game configurations
export const DEFAULT_GAMES: Omit<GameConfig, 'id' | 'createdAt'>[] = [
  {
    type: 'euchre',
    name: 'Euchre',
    description: 'Classic 4-player trick-taking card game played in 2v2 teams',
    isTeamGame: true,
    playersPerTeam: 2,
    minPlayers: 8, // 4 teams minimum
    maxPlayers: 24, // 12 teams maximum
    eliminationRules: {
      doubleEliminationMax: 0, // Always single elimination for Euchre
    },
  },
  {
    type: 'pool',
    name: 'Pool',
    description: '1v1 billiards tournament (8-ball, 9-ball, or custom)',
    isTeamGame: false,
    playersPerTeam: 1,
    minPlayers: 8,
    maxPlayers: 24,
    eliminationRules: {
      doubleEliminationMax: 16, // 8-16 players: double elim, 17+ single elim
    },
  },
  {
    type: 'chess',
    name: 'Chess',
    description: '1v1 chess matches with configurable time controls',
    isTeamGame: false,
    playersPerTeam: 1,
    minPlayers: 4,
    maxPlayers: 16,
    eliminationRules: {
      doubleEliminationMax: 8, // 4-8 players: double elim, 9+ single elim
    },
  },
];

// Get all games
export async function getAllGames(): Promise<GameConfig[]> {
  const results = await db.select().from(games);
  return results.map(parseGameRow);
}

// Get game by type
export async function getGameByType(type: GameType): Promise<GameConfig | null> {
  const results = await db
    .select()
    .from(games)
    .where(eq(games.type, type))
    .limit(1);

  if (results.length === 0) return null;
  return parseGameRow(results[0]);
}

// Get game by ID
export async function getGameById(id: string): Promise<GameConfig | null> {
  const results = await db
    .select()
    .from(games)
    .where(eq(games.id, id))
    .limit(1);

  if (results.length === 0) return null;
  return parseGameRow(results[0]);
}

// Seed default games if they don't exist
export async function seedDefaultGames(): Promise<void> {
  for (const gameConfig of DEFAULT_GAMES) {
    const existing = await getGameByType(gameConfig.type);
    if (!existing) {
      await db.insert(games).values({
        id: uuidv4(),
        type: gameConfig.type,
        name: gameConfig.name,
        description: gameConfig.description,
        isTeamGame: gameConfig.isTeamGame,
        playersPerTeam: gameConfig.playersPerTeam,
        minPlayers: gameConfig.minPlayers,
        maxPlayers: gameConfig.maxPlayers,
        eliminationRules: JSON.stringify(gameConfig.eliminationRules),
        createdAt: new Date(),
      });
    }
  }
}

// Determine elimination type based on participant count
export function determineEliminationType(
  game: GameConfig,
  participantCount: number
): EliminationType {
  const { doubleEliminationMax } = game.eliminationRules;
  
  // If doubleEliminationMax is 0, always use single elimination
  if (doubleEliminationMax === 0) {
    return 'single';
  }
  
  // Use double elimination if within threshold
  return participantCount <= doubleEliminationMax ? 'double' : 'single';
}

// Calculate number of participants (teams for team games, players for solo)
export function calculateParticipantCount(
  game: GameConfig,
  playerCount: number
): number {
  if (game.isTeamGame) {
    return Math.floor(playerCount / game.playersPerTeam);
  }
  return playerCount;
}

// Validate player count for a game
export function validatePlayerCount(
  game: GameConfig,
  playerCount: number
): { valid: boolean; message?: string } {
  if (playerCount < game.minPlayers) {
    return {
      valid: false,
      message: `Minimum ${game.minPlayers} players required for ${game.name}`,
    };
  }
  
  if (playerCount > game.maxPlayers) {
    return {
      valid: false,
      message: `Maximum ${game.maxPlayers} players allowed for ${game.name}`,
    };
  }
  
  if (game.isTeamGame && playerCount % game.playersPerTeam !== 0) {
    return {
      valid: false,
      message: `${game.name} requires ${game.playersPerTeam} players per team`,
    };
  }
  
  return { valid: true };
}

// Helper to parse database row
function parseGameRow(row: typeof games.$inferSelect): GameConfig {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description,
    isTeamGame: row.isTeamGame,
    playersPerTeam: row.playersPerTeam,
    minPlayers: row.minPlayers,
    maxPlayers: row.maxPlayers,
    eliminationRules: JSON.parse(row.eliminationRules) as EliminationRules,
    createdAt: row.createdAt || new Date(),
  };
}
