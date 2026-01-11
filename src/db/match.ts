import { v4 as uuidv4 } from 'uuid';
import { eq, and, or } from 'drizzle-orm';
import { db } from './drizzle';
import { matches, matchResults, MatchStatus, BracketType } from './schema';
import { BracketMatch, GeneratedBracket, advanceWinner } from '@/lib/bracket';

// ============================================
// TYPES
// ============================================

export interface Match {
  id: string;
  tournamentId: string;
  bracketType: BracketType;
  round: number;
  position: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  participant1Score: number;
  participant2Score: number;
  status: MatchStatus;
  nextMatchId: string | null;
  loserNextMatchId: string | null;
  scheduledTime: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchResult {
  id: string;
  matchId: string;
  submittedBy: string;
  claimedWinnerId: string;
  participant1Score: number;
  participant2Score: number;
  isOrganizerOverride: boolean;
  confirmedAt: Date | null;
  createdAt: Date;
}

// ============================================
// MATCH CRUD
// ============================================

export async function createMatchesFromBracket(
  generatedBracket: GeneratedBracket
): Promise<Match[]> {
  const now = new Date();
  const createdMatches: Match[] = [];

  for (const matchData of generatedBracket.matches) {
    const match = {
      ...matchData,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(matches).values(match);
    createdMatches.push(parseMatchRow(match));
  }

  return createdMatches;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const results = await db
    .select()
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);

  if (results.length === 0) return null;
  return parseMatchRow(results[0]);
}

export async function getMatchesByTournament(tournamentId: string): Promise<Match[]> {
  const results = await db
    .select()
    .from(matches)
    .where(eq(matches.tournamentId, tournamentId));

  return results.map(parseMatchRow);
}

export async function getMatchesByBracketType(
  tournamentId: string,
  bracketType: BracketType
): Promise<Match[]> {
  const results = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.bracketType, bracketType)
      )
    );

  return results.map(parseMatchRow);
}

export async function getReadyMatches(tournamentId: string): Promise<Match[]> {
  const results = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.status, 'ready')
      )
    );

  return results.map(parseMatchRow);
}

export async function getParticipantMatches(
  tournamentId: string,
  participantId: string
): Promise<Match[]> {
  const results = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        or(
          eq(matches.participant1Id, participantId),
          eq(matches.participant2Id, participantId)
        )
      )
    );

  return results.map(parseMatchRow);
}

export async function updateMatch(
  id: string,
  updates: Partial<Omit<Match, 'id' | 'tournamentId' | 'createdAt'>>
): Promise<Match | null> {
  const existing = await getMatchById(id);
  if (!existing) return null;

  const now = new Date();
  const updateData: Record<string, unknown> = { updatedAt: now };

  if (updates.participant1Id !== undefined) updateData.participant1Id = updates.participant1Id;
  if (updates.participant2Id !== undefined) updateData.participant2Id = updates.participant2Id;
  if (updates.winnerId !== undefined) updateData.winnerId = updates.winnerId;
  if (updates.loserId !== undefined) updateData.loserId = updates.loserId;
  if (updates.participant1Score !== undefined) updateData.participant1Score = updates.participant1Score;
  if (updates.participant2Score !== undefined) updateData.participant2Score = updates.participant2Score;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.scheduledTime !== undefined) updateData.scheduledTime = updates.scheduledTime;
  if (updates.startedAt !== undefined) updateData.startedAt = updates.startedAt;
  if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;

  await db.update(matches).set(updateData).where(eq(matches.id, id));

  return getMatchById(id);
}

export async function startMatch(id: string): Promise<Match | null> {
  const match = await getMatchById(id);
  if (!match) return null;

  if (match.status !== 'ready') {
    throw new Error('Match is not ready to start');
  }

  return updateMatch(id, {
    status: 'in_progress',
    startedAt: new Date(),
  });
}

// ============================================
// MATCH RESULTS
// ============================================

export async function submitMatchResult(
  matchId: string,
  submittedBy: string,
  claimedWinnerId: string,
  participant1Score: number,
  participant2Score: number,
  isOrganizerOverride: boolean = false
): Promise<MatchResult> {
  const id = uuidv4();
  const now = new Date();

  const result = {
    id,
    matchId,
    submittedBy,
    claimedWinnerId,
    participant1Score,
    participant2Score,
    isOrganizerOverride,
    confirmedAt: isOrganizerOverride ? now : null,
    createdAt: now,
  };

  await db.insert(matchResults).values(result);

  // If organizer override, immediately complete the match
  if (isOrganizerOverride) {
    await completeMatch(matchId, claimedWinnerId, participant1Score, participant2Score);
  } else {
    // Update match to awaiting confirmation
    await updateMatch(matchId, { status: 'awaiting_confirmation' });
  }

  return parseMatchResultRow(result);
}

export async function getMatchResults(matchId: string): Promise<MatchResult[]> {
  const results = await db
    .select()
    .from(matchResults)
    .where(eq(matchResults.matchId, matchId));

  return results.map(parseMatchResultRow);
}

export async function confirmMatchResult(
  matchId: string,
  confirmerId: string
): Promise<{ match: Match; result: MatchResult } | null> {
  const match = await getMatchById(matchId);
  if (!match) return null;

  const results = await getMatchResults(matchId);
  if (results.length === 0) return null;

  // Find the first unconfirmed result
  const pendingResult = results.find(r => !r.confirmedAt);
  if (!pendingResult) return null;

  // Check if confirmer is the opponent
  const submitterIsP1 = await isParticipantPlayer(match, pendingResult.submittedBy, 'participant1');
  const confirmerIsOpponent = submitterIsP1
    ? await isParticipantPlayer(match, confirmerId, 'participant2')
    : await isParticipantPlayer(match, confirmerId, 'participant1');

  if (!confirmerIsOpponent) {
    // Check if results match (both players submitted same result)
    const otherResult = results.find(r => 
      r.submittedBy !== pendingResult.submittedBy && 
      r.claimedWinnerId === pendingResult.claimedWinnerId
    );

    if (!otherResult) {
      throw new Error('Confirmation must come from the opponent');
    }
  }

  // Confirm the result
  const now = new Date();
  await db
    .update(matchResults)
    .set({ confirmedAt: now })
    .where(eq(matchResults.id, pendingResult.id));

  // Complete the match
  await completeMatch(
    matchId,
    pendingResult.claimedWinnerId,
    pendingResult.participant1Score,
    pendingResult.participant2Score
  );

  const updatedMatch = await getMatchById(matchId);
  const updatedResult = { ...pendingResult, confirmedAt: now };

  return {
    match: updatedMatch!,
    result: updatedResult,
  };
}

async function isParticipantPlayer(
  match: Match,
  userId: string,
  participant: 'participant1' | 'participant2'
): Promise<boolean> {
  // This would need to check if the userId is associated with the participant
  // For team games, check if user is on the team
  // For solo games, check if userId matches the participant's userId
  const participantId = participant === 'participant1' 
    ? match.participant1Id 
    : match.participant2Id;
  
  // Simplified check - in real implementation would look up participant details
  return participantId === userId;
}

export async function completeMatch(
  matchId: string,
  winnerId: string,
  participant1Score: number,
  participant2Score: number
): Promise<Match | null> {
  const match = await getMatchById(matchId);
  if (!match) return null;

  // Determine loser
  const loserId = match.participant1Id === winnerId 
    ? match.participant2Id 
    : match.participant1Id;

  // Update the match
  const completedMatch = await updateMatch(matchId, {
    winnerId,
    loserId,
    participant1Score,
    participant2Score,
    status: 'completed',
    completedAt: new Date(),
  });

  if (!completedMatch) return null;

  // Advance winner (and loser for double elimination)
  const allMatches = await getMatchesByTournament(match.tournamentId);
  const bracketMatches = allMatches.map(m => ({
    ...m,
    winnerId: m.id === matchId ? winnerId : m.winnerId,
    loserId: m.id === matchId ? loserId : m.loserId,
  })) as BracketMatch[];

  const matchToAdvance = bracketMatches.find(m => m.id === matchId)!;
  const updatedMatches = advanceWinner(matchToAdvance, bracketMatches);

  // Persist updated matches
  for (const updatedMatch of updatedMatches) {
    await updateMatch(updatedMatch.id, {
      participant1Id: updatedMatch.participant1Id,
      participant2Id: updatedMatch.participant2Id,
      status: updatedMatch.status,
    });
  }

  return completedMatch;
}

export async function disputeMatch(matchId: string): Promise<Match | null> {
  return updateMatch(matchId, { status: 'disputed' });
}

export async function resolveDispute(
  matchId: string,
  winnerId: string,
  participant1Score: number,
  participant2Score: number
): Promise<Match | null> {
  // This is essentially an organizer override
  return completeMatch(matchId, winnerId, participant1Score, participant2Score);
}

// ============================================
// BRACKET GENERATION INTEGRATION
// ============================================

export async function generateAndSaveBracket(
  tournamentId: string,
  participants: { id: string; seed: number | null }[],
  eliminationType: 'single' | 'double'
): Promise<Match[]> {
  const { generateBracket } = await import('@/lib/bracket');

  // Convert to TournamentParticipant format
  const participantData = participants.map(p => ({
    id: p.id,
    tournamentId,
    userId: null,
    teamId: null,
    status: 'registered' as const,
    seed: p.seed,
    finalPlacement: null,
    registeredAt: new Date(),
    updatedAt: new Date(),
  }));

  const bracket = generateBracket(tournamentId, participantData, eliminationType);
  return createMatchesFromBracket(bracket);
}

// ============================================
// TOURNAMENT COMPLETION
// ============================================

export async function isTournamentComplete(tournamentId: string): Promise<boolean> {
  const tournamentMatches = await getMatchesByTournament(tournamentId);
  
  // Check if there's a grand final or final match
  const finalMatch = tournamentMatches.find(m => 
    m.bracketType === 'grand_final' || 
    (m.bracketType === 'winners' && !m.nextMatchId)
  );

  if (!finalMatch) return false;
  return finalMatch.status === 'completed';
}

export async function getFinalStandings(
  tournamentId: string
): Promise<{ participantId: string; placement: number }[]> {
  const tournamentMatches = await getMatchesByTournament(tournamentId);
  const standings: { participantId: string; placement: number }[] = [];

  // Find completed matches and determine placements
  const finalMatch = tournamentMatches.find(m => 
    m.bracketType === 'grand_final' || 
    (m.bracketType === 'winners' && !m.nextMatchId)
  );

  if (finalMatch && finalMatch.winnerId && finalMatch.loserId) {
    standings.push({ participantId: finalMatch.winnerId, placement: 1 });
    standings.push({ participantId: finalMatch.loserId, placement: 2 });
  }

  // For 3rd place, look at losers bracket final or semi-final losers
  // This is simplified - would need more logic for accurate standings

  return standings;
}

// ============================================
// HELPERS
// ============================================

function parseMatchRow(row: typeof matches.$inferSelect | Record<string, unknown>): Match {
  return {
    id: row.id as string,
    tournamentId: row.tournamentId as string,
    bracketType: row.bracketType as BracketType,
    round: row.round as number,
    position: row.position as number,
    participant1Id: row.participant1Id as string | null,
    participant2Id: row.participant2Id as string | null,
    winnerId: row.winnerId as string | null,
    loserId: row.loserId as string | null,
    participant1Score: (row.participant1Score as number) || 0,
    participant2Score: (row.participant2Score as number) || 0,
    status: row.status as MatchStatus,
    nextMatchId: row.nextMatchId as string | null,
    loserNextMatchId: row.loserNextMatchId as string | null,
    scheduledTime: row.scheduledTime as Date | null,
    startedAt: row.startedAt as Date | null,
    completedAt: row.completedAt as Date | null,
    createdAt: (row.createdAt as Date) || new Date(),
    updatedAt: (row.updatedAt as Date) || new Date(),
  };
}

function parseMatchResultRow(row: typeof matchResults.$inferSelect | Record<string, unknown>): MatchResult {
  return {
    id: row.id as string,
    matchId: row.matchId as string,
    submittedBy: row.submittedBy as string,
    claimedWinnerId: row.claimedWinnerId as string,
    participant1Score: row.participant1Score as number,
    participant2Score: row.participant2Score as number,
    isOrganizerOverride: row.isOrganizerOverride as boolean,
    confirmedAt: row.confirmedAt as Date | null,
    createdAt: (row.createdAt as Date) || new Date(),
  };
}
