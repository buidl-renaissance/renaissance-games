import { v4 as uuidv4 } from 'uuid';
import { eq, desc, and, or } from 'drizzle-orm';
import { db } from './drizzle';
import {
  tournaments,
  tournamentParticipants,
  teams,
  teamMembers,
  TournamentStatus,
  EliminationType,
  ParticipantStatus,
} from './schema';
import { User } from './user';

// Re-export types for external use
export type { TournamentStatus, EliminationType, ParticipantStatus };
import { GameConfig, determineEliminationType } from './game';

// ============================================
// TYPES
// ============================================

export interface Tournament {
  id: string;
  gameId: string;
  organizerId: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  minParticipants: number;
  maxParticipants: number;
  eliminationType: EliminationType | null;
  entryFee: number | null;
  prizePool: number | null;
  prizeDistribution: PrizeDistribution | null;
  bestOf: number;
  registrationDeadline: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrizeDistribution {
  [placement: string]: number; // e.g., {"1": 70, "2": 20, "3": 10}
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  captainId: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: Date;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string | null;
  teamId: string | null;
  status: ParticipantStatus;
  seed: number | null;
  finalPlacement: number | null;
  registeredAt: Date;
  updatedAt: Date;
}

export interface CreateTournamentInput {
  gameId: string;
  organizerId: string;
  name: string;
  description?: string;
  minParticipants: number;
  maxParticipants: number;
  entryFee?: number;
  prizePool?: number;
  prizeDistribution?: PrizeDistribution;
  bestOf?: number;
  registrationDeadline?: Date;
  startTime?: Date;
  location?: string;
}

// ============================================
// TOURNAMENT CRUD
// ============================================

export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  const id = uuidv4();
  const now = new Date();
  
  const tournament = {
    id,
    gameId: input.gameId,
    organizerId: input.organizerId,
    name: input.name,
    description: input.description || null,
    status: 'draft' as TournamentStatus,
    minParticipants: input.minParticipants,
    maxParticipants: input.maxParticipants,
    eliminationType: null,
    entryFee: input.entryFee || 0,
    prizePool: input.prizePool || 0,
    prizeDistribution: input.prizeDistribution ? JSON.stringify(input.prizeDistribution) : null,
    bestOf: input.bestOf || 1,
    registrationDeadline: input.registrationDeadline || null,
    startTime: input.startTime || null,
    endTime: null,
    location: input.location || null,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(tournaments).values(tournament);
  
  return parseTournamentRow(tournament);
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const results = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id))
    .limit(1);
  
  if (results.length === 0) return null;
  return parseTournamentRow(results[0]);
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const results = await db
    .select()
    .from(tournaments)
    .orderBy(desc(tournaments.createdAt));
  
  return results.map(parseTournamentRow);
}

export async function getTournamentsByStatus(status: TournamentStatus): Promise<Tournament[]> {
  const results = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.status, status))
    .orderBy(desc(tournaments.createdAt));
  
  return results.map(parseTournamentRow);
}

export async function getTournamentsByOrganizer(organizerId: string): Promise<Tournament[]> {
  const results = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.organizerId, organizerId))
    .orderBy(desc(tournaments.createdAt));
  
  return results.map(parseTournamentRow);
}

export async function getActiveTournaments(): Promise<Tournament[]> {
  const results = await db
    .select()
    .from(tournaments)
    .where(
      or(
        eq(tournaments.status, 'registration'),
        eq(tournaments.status, 'ready'),
        eq(tournaments.status, 'in_progress')
      )
    )
    .orderBy(desc(tournaments.createdAt));
  
  return results.map(parseTournamentRow);
}

export async function updateTournament(
  id: string,
  updates: Partial<Omit<Tournament, 'id' | 'createdAt'>>
): Promise<Tournament | null> {
  const existing = await getTournamentById(id);
  if (!existing) return null;
  
  const now = new Date();
  const updateData: Record<string, unknown> = { updatedAt: now };
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.minParticipants !== undefined) updateData.minParticipants = updates.minParticipants;
  if (updates.maxParticipants !== undefined) updateData.maxParticipants = updates.maxParticipants;
  if (updates.eliminationType !== undefined) updateData.eliminationType = updates.eliminationType;
  if (updates.entryFee !== undefined) updateData.entryFee = updates.entryFee;
  if (updates.prizePool !== undefined) updateData.prizePool = updates.prizePool;
  if (updates.prizeDistribution !== undefined) {
    updateData.prizeDistribution = JSON.stringify(updates.prizeDistribution);
  }
  if (updates.bestOf !== undefined) updateData.bestOf = updates.bestOf;
  if (updates.registrationDeadline !== undefined) updateData.registrationDeadline = updates.registrationDeadline;
  if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
  if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
  if (updates.location !== undefined) updateData.location = updates.location;
  
  await db.update(tournaments).set(updateData).where(eq(tournaments.id, id));
  
  return getTournamentById(id);
}

export async function updateTournamentStatus(
  id: string,
  status: TournamentStatus
): Promise<Tournament | null> {
  return updateTournament(id, { status });
}

export async function openRegistration(id: string): Promise<Tournament | null> {
  return updateTournamentStatus(id, 'registration');
}

export async function closeTournament(id: string): Promise<Tournament | null> {
  return updateTournament(id, { status: 'completed', endTime: new Date() });
}

export async function cancelTournament(id: string): Promise<Tournament | null> {
  return updateTournamentStatus(id, 'cancelled');
}

// ============================================
// TEAMS
// ============================================

export async function createTeam(
  tournamentId: string,
  name: string,
  captainId: string
): Promise<Team> {
  const id = uuidv4();
  const now = new Date();
  
  const team = {
    id,
    tournamentId,
    name,
    captainId,
    isComplete: false,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(teams).values(team);
  
  // Add captain as first team member
  await addTeamMember(id, captainId);
  
  return parseTeamRow(team);
}

export async function getTeamById(id: string): Promise<Team | null> {
  const results = await db
    .select()
    .from(teams)
    .where(eq(teams.id, id))
    .limit(1);
  
  if (results.length === 0) return null;
  return parseTeamRow(results[0]);
}

export async function getTeamsByTournament(tournamentId: string): Promise<Team[]> {
  const results = await db
    .select()
    .from(teams)
    .where(eq(teams.tournamentId, tournamentId));
  
  return results.map(parseTeamRow);
}

export async function addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
  const id = uuidv4();
  const now = new Date();
  
  const member = {
    id,
    teamId,
    userId,
    joinedAt: now,
  };
  
  await db.insert(teamMembers).values(member);
  
  return parseTeamMemberRow(member);
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const results = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  
  return results.map(parseTeamMemberRow);
}

export async function updateTeamComplete(teamId: string, isComplete: boolean): Promise<Team | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;
  
  const now = new Date();
  await db
    .update(teams)
    .set({ isComplete, updatedAt: now })
    .where(eq(teams.id, teamId));
  
  return { ...team, isComplete, updatedAt: now };
}

export async function getUserTeamInTournament(
  tournamentId: string,
  userId: string
): Promise<Team | null> {
  // Find team member entry for this user
  const memberResults = await db.select().from(teamMembers);
  
  for (const member of memberResults) {
    if (member.userId === userId) {
      const team = await getTeamById(member.teamId);
      if (team && team.tournamentId === tournamentId) {
        return team;
      }
    }
  }
  
  return null;
}

// ============================================
// PARTICIPANTS
// ============================================

export async function registerParticipant(
  tournamentId: string,
  userId?: string,
  teamId?: string
): Promise<TournamentParticipant> {
  const id = uuidv4();
  const now = new Date();
  
  // Check if waitlist should apply
  const tournament = await getTournamentById(tournamentId);
  const participantCount = await getParticipantCount(tournamentId);
  const status: ParticipantStatus = 
    tournament && participantCount >= tournament.maxParticipants 
      ? 'waitlist' 
      : 'registered';
  
  const participant = {
    id,
    tournamentId,
    userId: userId || null,
    teamId: teamId || null,
    status,
    seed: null,
    finalPlacement: null,
    registeredAt: now,
    updatedAt: now,
  };
  
  await db.insert(tournamentParticipants).values(participant);
  
  return parseParticipantRow(participant);
}

export async function getParticipantById(id: string): Promise<TournamentParticipant | null> {
  const results = await db
    .select()
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.id, id))
    .limit(1);
  
  if (results.length === 0) return null;
  return parseParticipantRow(results[0]);
}

export async function getParticipantsByTournament(
  tournamentId: string
): Promise<TournamentParticipant[]> {
  const results = await db
    .select()
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.tournamentId, tournamentId));
  
  return results.map(parseParticipantRow);
}

export async function getRegisteredParticipants(
  tournamentId: string
): Promise<TournamentParticipant[]> {
  const results = await db
    .select()
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        or(
          eq(tournamentParticipants.status, 'registered'),
          eq(tournamentParticipants.status, 'confirmed'),
          eq(tournamentParticipants.status, 'checked_in')
        )
      )
    );
  
  return results.map(parseParticipantRow);
}

export async function getWaitlistParticipants(
  tournamentId: string
): Promise<TournamentParticipant[]> {
  const results = await db
    .select()
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.status, 'waitlist')
      )
    );
  
  return results.map(parseParticipantRow);
}

export async function getParticipantCount(tournamentId: string): Promise<number> {
  const participants = await getRegisteredParticipants(tournamentId);
  return participants.length;
}

export async function updateParticipantStatus(
  id: string,
  status: ParticipantStatus
): Promise<TournamentParticipant | null> {
  const participant = await getParticipantById(id);
  if (!participant) return null;
  
  const now = new Date();
  await db
    .update(tournamentParticipants)
    .set({ status, updatedAt: now })
    .where(eq(tournamentParticipants.id, id));
  
  return { ...participant, status, updatedAt: now };
}

export async function updateParticipantSeed(
  id: string,
  seed: number
): Promise<TournamentParticipant | null> {
  const participant = await getParticipantById(id);
  if (!participant) return null;
  
  const now = new Date();
  await db
    .update(tournamentParticipants)
    .set({ seed, updatedAt: now })
    .where(eq(tournamentParticipants.id, id));
  
  return { ...participant, seed, updatedAt: now };
}

export async function updateParticipantPlacement(
  id: string,
  finalPlacement: number
): Promise<TournamentParticipant | null> {
  const participant = await getParticipantById(id);
  if (!participant) return null;
  
  const now = new Date();
  await db
    .update(tournamentParticipants)
    .set({ finalPlacement, updatedAt: now })
    .where(eq(tournamentParticipants.id, id));
  
  return { ...participant, finalPlacement, updatedAt: now };
}

export async function withdrawParticipant(id: string): Promise<TournamentParticipant | null> {
  return updateParticipantStatus(id, 'withdrawn');
}

export async function eliminateParticipant(id: string): Promise<TournamentParticipant | null> {
  return updateParticipantStatus(id, 'eliminated');
}

export async function isUserRegistered(
  tournamentId: string,
  userId: string
): Promise<boolean> {
  const results = await db
    .select()
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.userId, userId)
      )
    )
    .limit(1);
  
  return results.length > 0;
}

export async function getUserParticipant(
  tournamentId: string,
  userId: string
): Promise<TournamentParticipant | null> {
  const results = await db
    .select()
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.userId, userId)
      )
    )
    .limit(1);
  
  if (results.length === 0) return null;
  return parseParticipantRow(results[0]);
}

// ============================================
// TOURNAMENT LIFECYCLE HELPERS
// ============================================

export async function canStartTournament(
  tournament: Tournament,
  game: GameConfig
): Promise<{ canStart: boolean; reason?: string }> {
  const participantCount = await getParticipantCount(tournament.id);
  
  if (tournament.status !== 'registration' && tournament.status !== 'ready') {
    return { canStart: false, reason: 'Tournament is not in registration or ready status' };
  }
  
  if (participantCount < tournament.minParticipants) {
    return {
      canStart: false,
      reason: `Need at least ${tournament.minParticipants} participants (have ${participantCount})`,
    };
  }
  
  // For team games, verify all teams are complete
  if (game.isTeamGame) {
    const tournamentTeams = await getTeamsByTournament(tournament.id);
    const incompleteTeams = tournamentTeams.filter(t => !t.isComplete);
    if (incompleteTeams.length > 0) {
      return {
        canStart: false,
        reason: `${incompleteTeams.length} team(s) are incomplete`,
      };
    }
  }
  
  return { canStart: true };
}

export async function startTournament(
  tournamentId: string,
  game: GameConfig
): Promise<Tournament | null> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) return null;
  
  const { canStart, reason } = await canStartTournament(tournament, game);
  if (!canStart) {
    throw new Error(reason);
  }
  
  // Determine elimination type based on participant count
  const participantCount = await getParticipantCount(tournamentId);
  const eliminationType = determineEliminationType(game, participantCount);
  
  // Update tournament status and elimination type
  return updateTournament(tournamentId, {
    status: 'in_progress',
    eliminationType,
    startTime: new Date(),
  });
}

// ============================================
// HELPERS
// ============================================

function parseTournamentRow(row: typeof tournaments.$inferSelect | Record<string, unknown>): Tournament {
  return {
    id: row.id as string,
    gameId: row.gameId as string,
    organizerId: row.organizerId as string,
    name: row.name as string,
    description: row.description as string | null,
    status: row.status as TournamentStatus,
    minParticipants: row.minParticipants as number,
    maxParticipants: row.maxParticipants as number,
    eliminationType: row.eliminationType as EliminationType | null,
    entryFee: row.entryFee as number | null,
    prizePool: row.prizePool as number | null,
    prizeDistribution: row.prizeDistribution 
      ? JSON.parse(row.prizeDistribution as string) as PrizeDistribution
      : null,
    bestOf: row.bestOf as number,
    registrationDeadline: row.registrationDeadline as Date | null,
    startTime: row.startTime as Date | null,
    endTime: row.endTime as Date | null,
    location: row.location as string | null,
    createdAt: (row.createdAt as Date) || new Date(),
    updatedAt: (row.updatedAt as Date) || new Date(),
  };
}

function parseTeamRow(row: typeof teams.$inferSelect | Record<string, unknown>): Team {
  return {
    id: row.id as string,
    tournamentId: row.tournamentId as string,
    name: row.name as string,
    captainId: row.captainId as string,
    isComplete: row.isComplete as boolean,
    createdAt: (row.createdAt as Date) || new Date(),
    updatedAt: (row.updatedAt as Date) || new Date(),
  };
}

function parseTeamMemberRow(row: typeof teamMembers.$inferSelect | Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    teamId: row.teamId as string,
    userId: row.userId as string,
    joinedAt: (row.joinedAt as Date) || new Date(),
  };
}

function parseParticipantRow(
  row: typeof tournamentParticipants.$inferSelect | Record<string, unknown>
): TournamentParticipant {
  return {
    id: row.id as string,
    tournamentId: row.tournamentId as string,
    userId: row.userId as string | null,
    teamId: row.teamId as string | null,
    status: row.status as ParticipantStatus,
    seed: row.seed as number | null,
    finalPlacement: row.finalPlacement as number | null,
    registeredAt: (row.registeredAt as Date) || new Date(),
    updatedAt: (row.updatedAt as Date) || new Date(),
  };
}
