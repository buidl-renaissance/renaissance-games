import { v4 as uuidv4 } from 'uuid';
import { EliminationType, BracketType, MatchStatus } from '@/db/schema';
import { TournamentParticipant } from '@/db/tournament';

// ============================================
// TYPES
// ============================================

export interface BracketMatch {
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

export interface GeneratedBracket {
  matches: Omit<BracketMatch, 'createdAt' | 'updatedAt'>[];
  rounds: number;
  totalMatches: number;
}

// ============================================
// BRACKET GENERATION
// ============================================

/**
 * Generate a complete bracket for a tournament
 */
export function generateBracket(
  tournamentId: string,
  participants: TournamentParticipant[],
  eliminationType: EliminationType
): GeneratedBracket {
  // Shuffle participants for random seeding (or use existing seeds if set)
  const seededParticipants = seedParticipants(participants);

  if (eliminationType === 'single') {
    return generateSingleEliminationBracket(tournamentId, seededParticipants);
  }

  return generateDoubleEliminationBracket(tournamentId, seededParticipants);
}

/**
 * Seed participants - use existing seeds or randomize
 */
function seedParticipants(participants: TournamentParticipant[]): TournamentParticipant[] {
  const withSeeds = participants.filter(p => p.seed !== null);
  const withoutSeeds = participants.filter(p => p.seed === null);

  // Shuffle unseeded participants
  const shuffled = [...withoutSeeds].sort(() => Math.random() - 0.5);

  // Combine seeded (in order) with shuffled unseeded
  const sorted = [...withSeeds].sort((a, b) => (a.seed || 0) - (b.seed || 0));

  return [...sorted, ...shuffled];
}

/**
 * Calculate the next power of 2 >= n
 */
function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Calculate number of rounds needed for n participants
 */
function calculateRounds(participantCount: number): number {
  return Math.ceil(Math.log2(participantCount));
}

// ============================================
// SINGLE ELIMINATION
// ============================================

function generateSingleEliminationBracket(
  tournamentId: string,
  participants: TournamentParticipant[]
): GeneratedBracket {
  const participantCount = participants.length;
  const bracketSize = nextPowerOf2(participantCount);
  const rounds = calculateRounds(bracketSize);
  const byeCount = bracketSize - participantCount;

  const matches: Omit<BracketMatch, 'createdAt' | 'updatedAt'>[] = [];
  const now = new Date();

  // Generate all matches for each round
  let matchIndex = 0;
  const matchesByRound: Map<number, string[]> = new Map();

  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    matchesByRound.set(round, []);

    for (let position = 0; position < matchesInRound; position++) {
      const matchId = uuidv4();
      matchesByRound.get(round)!.push(matchId);

      matches.push({
        id: matchId,
        tournamentId,
        bracketType: 'winners',
        round,
        position,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        participant1Score: 0,
        participant2Score: 0,
        status: 'pending',
        nextMatchId: null,
        loserNextMatchId: null,
        scheduledTime: null,
        startedAt: null,
        completedAt: null,
      });

      matchIndex++;
    }
  }

  // Link matches to next round
  for (let round = 1; round < rounds; round++) {
    const currentRoundMatches = matchesByRound.get(round)!;
    const nextRoundMatches = matchesByRound.get(round + 1)!;

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      const match = matches.find(m => m.id === currentRoundMatches[i])!;
      match.nextMatchId = nextRoundMatches[nextMatchIndex];
    }
  }

  // Assign participants to first round with byes
  const firstRoundMatches = matches.filter(m => m.round === 1);
  assignParticipantsWithByes(firstRoundMatches, participants, byeCount, matches);

  // Update status for matches that are ready
  for (const match of matches) {
    if (match.participant1Id && match.participant2Id) {
      match.status = 'ready';
    }
  }

  return {
    matches,
    rounds,
    totalMatches: matches.length,
  };
}

// ============================================
// DOUBLE ELIMINATION
// ============================================

function generateDoubleEliminationBracket(
  tournamentId: string,
  participants: TournamentParticipant[]
): GeneratedBracket {
  const participantCount = participants.length;
  const bracketSize = nextPowerOf2(participantCount);
  const winnersRounds = calculateRounds(bracketSize);
  const losersRounds = (winnersRounds - 1) * 2; // Losers bracket has more rounds
  const byeCount = bracketSize - participantCount;

  const matches: Omit<BracketMatch, 'createdAt' | 'updatedAt'>[] = [];

  // Generate winners bracket
  const winnerMatchesByRound: Map<number, string[]> = new Map();

  for (let round = 1; round <= winnersRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    winnerMatchesByRound.set(round, []);

    for (let position = 0; position < matchesInRound; position++) {
      const matchId = uuidv4();
      winnerMatchesByRound.get(round)!.push(matchId);

      matches.push({
        id: matchId,
        tournamentId,
        bracketType: 'winners',
        round,
        position,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        participant1Score: 0,
        participant2Score: 0,
        status: 'pending',
        nextMatchId: null,
        loserNextMatchId: null,
        scheduledTime: null,
        startedAt: null,
        completedAt: null,
      });
    }
  }

  // Generate losers bracket
  const loserMatchesByRound: Map<number, string[]> = new Map();

  for (let round = 1; round <= losersRounds; round++) {
    // Losers bracket has a specific structure:
    // Odd rounds: losers from winners bracket drop in
    // Even rounds: losers play each other
    const matchesInRound = calculateLosersMatchesInRound(round, bracketSize);
    loserMatchesByRound.set(round, []);

    for (let position = 0; position < matchesInRound; position++) {
      const matchId = uuidv4();
      loserMatchesByRound.get(round)!.push(matchId);

      matches.push({
        id: matchId,
        tournamentId,
        bracketType: 'losers',
        round,
        position,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        loserId: null,
        participant1Score: 0,
        participant2Score: 0,
        status: 'pending',
        nextMatchId: null,
        loserNextMatchId: null,
        scheduledTime: null,
        startedAt: null,
        completedAt: null,
      });
    }
  }

  // Grand Final
  const grandFinalId = uuidv4();
  matches.push({
    id: grandFinalId,
    tournamentId,
    bracketType: 'grand_final',
    round: 1,
    position: 0,
    participant1Id: null, // Winners bracket champion
    participant2Id: null, // Losers bracket champion
    winnerId: null,
    loserId: null,
    participant1Score: 0,
    participant2Score: 0,
    status: 'pending',
    nextMatchId: null,
    loserNextMatchId: null,
    scheduledTime: null,
    startedAt: null,
    completedAt: null,
  });

  // Link winners bracket matches
  for (let round = 1; round < winnersRounds; round++) {
    const currentRoundMatches = winnerMatchesByRound.get(round)!;
    const nextRoundMatches = winnerMatchesByRound.get(round + 1)!;

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const match = matches.find(m => m.id === currentRoundMatches[i])!;
      match.nextMatchId = nextRoundMatches[Math.floor(i / 2)];

      // Link to losers bracket (losers drop down)
      const losersRound = round === 1 ? 1 : (round - 1) * 2 + 1;
      const losersMatches = loserMatchesByRound.get(losersRound);
      if (losersMatches && losersMatches.length > 0) {
        match.loserNextMatchId = losersMatches[Math.floor(i / 2) % losersMatches.length];
      }
    }
  }

  // Link winners final to grand final
  const winnersFinal = matches.find(m => m.bracketType === 'winners' && m.round === winnersRounds)!;
  winnersFinal.nextMatchId = grandFinalId;

  // Link losers bracket matches
  for (let round = 1; round < losersRounds; round++) {
    const currentRoundMatches = loserMatchesByRound.get(round);
    const nextRoundMatches = loserMatchesByRound.get(round + 1);

    if (currentRoundMatches && nextRoundMatches) {
      for (let i = 0; i < currentRoundMatches.length; i++) {
        const match = matches.find(m => m.id === currentRoundMatches[i])!;
        match.nextMatchId = nextRoundMatches[Math.floor(i / 2) % nextRoundMatches.length];
      }
    }
  }

  // Link losers final to grand final
  const losersFinal = matches.find(m => m.bracketType === 'losers' && m.round === losersRounds);
  if (losersFinal) {
    losersFinal.nextMatchId = grandFinalId;
  }

  // Assign participants to first round with byes
  const firstRoundMatches = matches.filter(m => m.bracketType === 'winners' && m.round === 1);
  assignParticipantsWithByes(firstRoundMatches, participants, byeCount, matches);

  // Update status for matches that are ready
  for (const match of matches) {
    if (match.participant1Id && match.participant2Id) {
      match.status = 'ready';
    }
  }

  return {
    matches,
    rounds: winnersRounds + losersRounds + 1, // +1 for grand final
    totalMatches: matches.length,
  };
}

function calculateLosersMatchesInRound(round: number, bracketSize: number): number {
  // Simplified losers bracket structure
  // This is a basic approximation - could be refined
  const winnersRounds = calculateRounds(bracketSize);
  const baseMatches = bracketSize / 4;
  const roundPair = Math.ceil(round / 2);
  return Math.max(1, Math.floor(baseMatches / Math.pow(2, roundPair - 1)));
}

// ============================================
// BYE HANDLING
// ============================================

function assignParticipantsWithByes(
  firstRoundMatches: Omit<BracketMatch, 'createdAt' | 'updatedAt'>[],
  participants: TournamentParticipant[],
  byeCount: number,
  allMatches: Omit<BracketMatch, 'createdAt' | 'updatedAt'>[]
): void {
  // Standard bye placement - top seeds get byes
  const matchCount = firstRoundMatches.length;
  let participantIndex = 0;

  // Sort matches by position to ensure consistent assignment
  const sortedMatches = [...firstRoundMatches].sort((a, b) => a.position - b.position);

  for (let i = 0; i < sortedMatches.length; i++) {
    const match = sortedMatches[i];

    // Check if this match should have a bye
    if (i < byeCount) {
      // This position gets a bye - only one participant plays
      if (participantIndex < participants.length) {
        match.participant1Id = participants[participantIndex].id;
        participantIndex++;
        
        // Auto-advance the participant with bye
        match.winnerId = match.participant1Id;
        match.status = 'completed';
        
        // Advance to next match
        if (match.nextMatchId) {
          const nextMatch = allMatches.find(m => m.id === match.nextMatchId);
          if (nextMatch) {
            // Determine which slot in next match
            const slotInNext = Math.floor(match.position / 2);
            if (match.position % 2 === 0) {
              nextMatch.participant1Id = match.participant1Id;
            } else {
              nextMatch.participant2Id = match.participant1Id;
            }
          }
        }
      }
    } else {
      // Normal match - two participants
      if (participantIndex < participants.length) {
        match.participant1Id = participants[participantIndex].id;
        participantIndex++;
      }
      if (participantIndex < participants.length) {
        match.participant2Id = participants[participantIndex].id;
        participantIndex++;
      }
    }
  }
}

// ============================================
// BRACKET PROGRESSION
// ============================================

/**
 * Advance winner to next match after a match completes
 */
export function advanceWinner(
  completedMatch: BracketMatch,
  allMatches: BracketMatch[]
): BracketMatch[] {
  const updatedMatches: BracketMatch[] = [];

  if (!completedMatch.winnerId || !completedMatch.nextMatchId) {
    return updatedMatches;
  }

  // Advance winner to next match
  const nextMatch = allMatches.find(m => m.id === completedMatch.nextMatchId);
  if (nextMatch) {
    // Determine which slot based on position
    if (completedMatch.position % 2 === 0) {
      nextMatch.participant1Id = completedMatch.winnerId;
    } else {
      nextMatch.participant2Id = completedMatch.winnerId;
    }

    // Check if match is now ready
    if (nextMatch.participant1Id && nextMatch.participant2Id) {
      nextMatch.status = 'ready';
    }

    updatedMatches.push(nextMatch);
  }

  // For double elimination, also handle loser advancement
  if (completedMatch.loserNextMatchId && completedMatch.loserId) {
    const loserNextMatch = allMatches.find(m => m.id === completedMatch.loserNextMatchId);
    if (loserNextMatch) {
      // Add loser to losers bracket match
      if (!loserNextMatch.participant1Id) {
        loserNextMatch.participant1Id = completedMatch.loserId;
      } else {
        loserNextMatch.participant2Id = completedMatch.loserId;
      }

      if (loserNextMatch.participant1Id && loserNextMatch.participant2Id) {
        loserNextMatch.status = 'ready';
      }

      updatedMatches.push(loserNextMatch);
    }
  }

  return updatedMatches;
}

/**
 * Get bracket structure for visualization
 */
export interface BracketVisualization {
  winners: BracketRound[];
  losers: BracketRound[];
  grandFinal: BracketMatch | null;
}

export interface BracketRound {
  round: number;
  matches: BracketMatch[];
}

export function getBracketVisualization(matches: BracketMatch[]): BracketVisualization {
  const winners: BracketRound[] = [];
  const losers: BracketRound[] = [];
  let grandFinal: BracketMatch | null = null;

  // Group matches by bracket type and round
  const winnersMatches = matches.filter(m => m.bracketType === 'winners');
  const losersMatches = matches.filter(m => m.bracketType === 'losers');
  const grandFinalMatch = matches.find(m => m.bracketType === 'grand_final');

  // Organize winners bracket by round
  const winnersRounds = new Set(winnersMatches.map(m => m.round));
  for (const round of [...winnersRounds].sort((a, b) => a - b)) {
    winners.push({
      round,
      matches: winnersMatches
        .filter(m => m.round === round)
        .sort((a, b) => a.position - b.position),
    });
  }

  // Organize losers bracket by round
  const losersRounds = new Set(losersMatches.map(m => m.round));
  for (const round of [...losersRounds].sort((a, b) => a - b)) {
    losers.push({
      round,
      matches: losersMatches
        .filter(m => m.round === round)
        .sort((a, b) => a.position - b.position),
    });
  }

  grandFinal = grandFinalMatch || null;

  return { winners, losers, grandFinal };
}
