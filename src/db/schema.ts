import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User roles
export type UserRole = 'user' | 'organizer' | 'admin';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fid: text('fid').notNull().unique(),
  username: text('username'),
  displayName: text('displayName'),
  pfpUrl: text('pfpUrl'),
  role: text('role').$type<UserRole>().default('user').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Farcaster Accounts table
export const farcasterAccounts = sqliteTable('farcaster_accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  fid: text('fid').notNull().unique(),
  username: text('username').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ============================================
// TOURNAMENT SYSTEM TABLES
// ============================================

// Game types: euchre, pool, chess
export type GameType = 'euchre' | 'pool' | 'chess';

// Games configuration table
export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  type: text('type').$type<GameType>().notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  // Format configuration
  isTeamGame: integer('isTeamGame', { mode: 'boolean' }).default(false).notNull(),
  playersPerTeam: integer('playersPerTeam').default(1).notNull(),
  minPlayers: integer('minPlayers').notNull(),
  maxPlayers: integer('maxPlayers').notNull(),
  // Elimination rules (stored as JSON thresholds)
  // e.g., {"single": 17, "double": 16} means: <=16 double elim, 17+ single elim
  eliminationRules: text('eliminationRules').notNull(), // JSON string
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Tournament status lifecycle
export type TournamentStatus = 'draft' | 'registration' | 'ready' | 'in_progress' | 'completed' | 'cancelled';

// Elimination types
export type EliminationType = 'single' | 'double';

// Tournaments table
export const tournaments = sqliteTable('tournaments', {
  id: text('id').primaryKey(),
  gameId: text('gameId').notNull().references(() => games.id),
  organizerId: text('organizerId').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').$type<TournamentStatus>().default('draft').notNull(),
  // Player limits
  minParticipants: integer('minParticipants').notNull(),
  maxParticipants: integer('maxParticipants').notNull(),
  // Elimination type (auto-determined or manually set)
  eliminationType: text('eliminationType').$type<EliminationType>(),
  // Entry fee and prizes (placeholder for future)
  entryFee: integer('entryFee').default(0), // in cents
  prizePool: integer('prizePool').default(0), // in cents
  prizeDistribution: text('prizeDistribution'), // JSON: {"1": 70, "2": 20, "3": 10} percentages
  // Match configuration
  bestOf: integer('bestOf').default(1).notNull(), // best of X games per match
  // Scheduling
  registrationDeadline: integer('registrationDeadline', { mode: 'timestamp' }),
  startTime: integer('startTime', { mode: 'timestamp' }),
  endTime: integer('endTime', { mode: 'timestamp' }),
  // Location (in-person events)
  location: text('location'),
  // Timestamps
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Teams table (for team-based games like Euchre)
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  tournamentId: text('tournamentId').notNull().references(() => tournaments.id),
  name: text('name').notNull(),
  captainId: text('captainId').notNull().references(() => users.id),
  // Team status
  isComplete: integer('isComplete', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Team members table
export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('teamId').notNull().references(() => teams.id),
  userId: text('userId').notNull().references(() => users.id),
  joinedAt: integer('joinedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Participant status
export type ParticipantStatus = 'registered' | 'waitlist' | 'confirmed' | 'checked_in' | 'eliminated' | 'withdrawn';

// Tournament participants (for solo games, or linking teams)
export const tournamentParticipants = sqliteTable('tournament_participants', {
  id: text('id').primaryKey(),
  tournamentId: text('tournamentId').notNull().references(() => tournaments.id),
  // Either userId (solo) OR teamId (team game) - one must be set
  userId: text('userId').references(() => users.id),
  teamId: text('teamId').references(() => teams.id),
  status: text('status').$type<ParticipantStatus>().default('registered').notNull(),
  seed: integer('seed'), // for bracket seeding
  finalPlacement: integer('finalPlacement'), // 1st, 2nd, 3rd, etc.
  registeredAt: integer('registeredAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Match status
export type MatchStatus = 'pending' | 'ready' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'disputed';

// Bracket type for double elimination
export type BracketType = 'winners' | 'losers' | 'grand_final';

// Matches table
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  tournamentId: text('tournamentId').notNull().references(() => tournaments.id),
  // Bracket position
  bracketType: text('bracketType').$type<BracketType>().default('winners').notNull(),
  round: integer('round').notNull(), // 1, 2, 3... (round number)
  position: integer('position').notNull(), // position within round (0-indexed)
  // Participants (can be userId or teamId depending on game type)
  participant1Id: text('participant1Id').references(() => tournamentParticipants.id),
  participant2Id: text('participant2Id').references(() => tournamentParticipants.id),
  // Winner (set after match completes)
  winnerId: text('winnerId').references(() => tournamentParticipants.id),
  loserId: text('loserId').references(() => tournamentParticipants.id),
  // Score tracking
  participant1Score: integer('participant1Score').default(0),
  participant2Score: integer('participant2Score').default(0),
  // Status
  status: text('status').$type<MatchStatus>().default('pending').notNull(),
  // For progressing brackets
  nextMatchId: text('nextMatchId'), // winner goes here
  loserNextMatchId: text('loserNextMatchId'), // for double elim, loser goes here
  // Scheduling
  scheduledTime: integer('scheduledTime', { mode: 'timestamp' }),
  startedAt: integer('startedAt', { mode: 'timestamp' }),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  // Timestamps
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Match result submissions (for dual confirmation)
export const matchResults = sqliteTable('match_results', {
  id: text('id').primaryKey(),
  matchId: text('matchId').notNull().references(() => matches.id),
  submittedBy: text('submittedBy').notNull().references(() => users.id),
  // Claimed result
  claimedWinnerId: text('claimedWinnerId').notNull().references(() => tournamentParticipants.id),
  participant1Score: integer('participant1Score').notNull(),
  participant2Score: integer('participant2Score').notNull(),
  // Confirmation
  isOrganizerOverride: integer('isOrganizerOverride', { mode: 'boolean' }).default(false).notNull(),
  confirmedAt: integer('confirmedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});
