import React from 'react';
import styled, { keyframes } from 'styled-components';

interface Match {
  id: string;
  bracketType: string;
  round: number;
  position: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  participant1Score: number;
  participant2Score: number;
  status: string;
}

interface BracketRound {
  round: number;
  matches: Match[];
}

interface BracketVisualization {
  winners: BracketRound[];
  losers: BracketRound[];
  grandFinal: Match | null;
}

interface ParticipantInfo {
  id: string;
  name: string;
  isTeam?: boolean;
}

interface BracketViewProps {
  bracket: BracketVisualization;
  participants: Map<string, ParticipantInfo>;
  eliminationType: 'single' | 'double';
  onMatchClick?: (match: Match) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const Container = styled.div`
  overflow-x: auto;
  padding: 1rem;
`;

const BracketSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const BracketContainer = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  min-width: fit-content;
`;

const Round = styled.div<{ $roundIndex: number }>`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out ${({ $roundIndex }) => $roundIndex * 0.1}s both;
`;

const RoundHeader = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
`;

const MatchCard = styled.div<{ $status: string; $clickable?: boolean }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme, $status }) => 
    $status === 'completed' ? theme.border :
    $status === 'in_progress' ? '#22c55e' :
    $status === 'ready' ? theme.accentGold :
    theme.border};
  border-radius: 8px;
  min-width: 180px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  
  ${({ $clickable, theme }) => $clickable && `
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${theme.shadow};
    }
  `}
`;

const MatchHeader = styled.div<{ $status: string }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.35rem 0.75rem;
  background: ${({ theme, $status }) => 
    $status === 'completed' ? theme.backgroundAlt :
    $status === 'in_progress' ? '#22c55e20' :
    $status === 'ready' ? `${theme.accentGold}20` :
    theme.backgroundAlt};
  color: ${({ theme, $status }) => 
    $status === 'in_progress' ? '#22c55e' :
    $status === 'ready' ? theme.accentGold :
    theme.textSecondary};
  display: flex;
  justify-content: space-between;
`;

const ParticipantRow = styled.div<{ $isWinner?: boolean; $isLoser?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: ${({ theme, $isWinner }) => $isWinner ? `${theme.accent}10` : 'transparent'};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantName = styled.span<{ $isWinner?: boolean; $isTBD?: boolean }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme, $isWinner, $isTBD }) => 
    $isTBD ? theme.textSecondary :
    $isWinner ? theme.accent :
    theme.text};
  font-weight: ${({ $isWinner }) => $isWinner ? '600' : '400'};
  font-style: ${({ $isTBD }) => $isTBD ? 'italic' : 'normal'};
`;

const Score = styled.span<{ $isWinner?: boolean }>`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme, $isWinner }) => $isWinner ? theme.accent : theme.textSecondary};
  min-width: 1.5rem;
  text-align: right;
`;

const Connector = styled.div`
  position: relative;
  width: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.border};
  }
`;

const GrandFinalSection = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;
`;

const GrandFinalCard = styled(MatchCard)`
  min-width: 220px;
  border-width: 2px;
  border-color: ${({ theme }) => theme.accentGold};
`;

const GrandFinalBadge = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  padding: 0.5rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: white;
`;

const EmptyBracket = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${({ theme }) => theme.textSecondary};
  font-family: 'Crimson Pro', Georgia, serif;
  font-style: italic;
`;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  ready: 'Ready',
  in_progress: 'Live',
  awaiting_confirmation: 'Confirming',
  completed: 'Done',
  disputed: 'Disputed',
};

const ROUND_NAMES: Record<number, string> = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Quarterfinals',
  4: 'Semifinals',
  5: 'Finals',
};

function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round + 1;
  if (roundsFromEnd === 1) return 'Finals';
  if (roundsFromEnd === 2) return 'Semifinals';
  if (roundsFromEnd === 3) return 'Quarterfinals';
  return `Round ${round}`;
}

export const BracketView: React.FC<BracketViewProps> = ({
  bracket,
  participants,
  eliminationType,
  onMatchClick,
}) => {
  const getParticipantName = (participantId: string | null): string => {
    if (!participantId) return 'TBD';
    const participant = participants.get(participantId);
    return participant?.name || `Player ${participantId.slice(0, 6)}`;
  };

  const renderMatch = (match: Match, showConnector: boolean = false) => {
    const p1Name = getParticipantName(match.participant1Id);
    const p2Name = getParticipantName(match.participant2Id);
    const p1IsWinner = match.winnerId === match.participant1Id;
    const p2IsWinner = match.winnerId === match.participant2Id;
    const isClickable = match.status === 'ready' || match.status === 'in_progress' || match.status === 'awaiting_confirmation';

    return (
      <div style={{ display: 'flex', alignItems: 'center' }} key={match.id}>
        <MatchCard 
          $status={match.status} 
          $clickable={isClickable && !!onMatchClick}
          onClick={() => isClickable && onMatchClick?.(match)}
        >
          <MatchHeader $status={match.status}>
            <span>Match {match.position + 1}</span>
            <span>{STATUS_LABELS[match.status] || match.status}</span>
          </MatchHeader>
          <ParticipantRow $isWinner={p1IsWinner}>
            <ParticipantName $isWinner={p1IsWinner} $isTBD={!match.participant1Id}>
              {p1Name}
            </ParticipantName>
            <Score $isWinner={p1IsWinner}>
              {match.status === 'completed' ? match.participant1Score : '-'}
            </Score>
          </ParticipantRow>
          <ParticipantRow $isWinner={p2IsWinner}>
            <ParticipantName $isWinner={p2IsWinner} $isTBD={!match.participant2Id}>
              {p2Name}
            </ParticipantName>
            <Score $isWinner={p2IsWinner}>
              {match.status === 'completed' ? match.participant2Score : '-'}
            </Score>
          </ParticipantRow>
        </MatchCard>
        {showConnector && <Connector />}
      </div>
    );
  };

  if (!bracket.winners.length) {
    return (
      <EmptyBracket>
        Bracket has not been generated yet
      </EmptyBracket>
    );
  }

  const totalRounds = bracket.winners.length;

  return (
    <Container>
      <BracketSection>
        <SectionTitle>
          {eliminationType === 'double' ? 'Winners Bracket' : 'Tournament Bracket'}
        </SectionTitle>
        <BracketContainer>
          {bracket.winners.map((round, roundIndex) => (
            <Round key={round.round} $roundIndex={roundIndex}>
              <RoundHeader>
                {getRoundName(round.round, totalRounds)}
              </RoundHeader>
              {round.matches.map((match, matchIndex) => 
                renderMatch(match, roundIndex < bracket.winners.length - 1)
              )}
            </Round>
          ))}
        </BracketContainer>
      </BracketSection>

      {eliminationType === 'double' && bracket.losers.length > 0 && (
        <BracketSection>
          <SectionTitle>Losers Bracket</SectionTitle>
          <BracketContainer>
            {bracket.losers.map((round, roundIndex) => (
              <Round key={round.round} $roundIndex={roundIndex}>
                <RoundHeader>
                  L-Round {round.round}
                </RoundHeader>
                {round.matches.map((match) => 
                  renderMatch(match, roundIndex < bracket.losers.length - 1)
                )}
              </Round>
            ))}
          </BracketContainer>
        </BracketSection>
      )}

      {bracket.grandFinal && (
        <BracketSection>
          <SectionTitle>Grand Final</SectionTitle>
          <GrandFinalSection>
            <GrandFinalCard 
              $status={bracket.grandFinal.status}
              $clickable={
                (bracket.grandFinal.status === 'ready' || 
                 bracket.grandFinal.status === 'in_progress') && 
                !!onMatchClick
              }
              onClick={() => 
                (bracket.grandFinal!.status === 'ready' || 
                 bracket.grandFinal!.status === 'in_progress') && 
                onMatchClick?.(bracket.grandFinal!)
              }
            >
              <GrandFinalBadge>🏆 Grand Final</GrandFinalBadge>
              <MatchHeader $status={bracket.grandFinal.status}>
                <span>Championship Match</span>
                <span>{STATUS_LABELS[bracket.grandFinal.status]}</span>
              </MatchHeader>
              <ParticipantRow 
                $isWinner={bracket.grandFinal.winnerId === bracket.grandFinal.participant1Id}
              >
                <ParticipantName 
                  $isWinner={bracket.grandFinal.winnerId === bracket.grandFinal.participant1Id}
                  $isTBD={!bracket.grandFinal.participant1Id}
                >
                  {getParticipantName(bracket.grandFinal.participant1Id)}
                  {bracket.grandFinal.participant1Id && ' (W)'}
                </ParticipantName>
                <Score $isWinner={bracket.grandFinal.winnerId === bracket.grandFinal.participant1Id}>
                  {bracket.grandFinal.status === 'completed' 
                    ? bracket.grandFinal.participant1Score 
                    : '-'}
                </Score>
              </ParticipantRow>
              <ParticipantRow 
                $isWinner={bracket.grandFinal.winnerId === bracket.grandFinal.participant2Id}
              >
                <ParticipantName 
                  $isWinner={bracket.grandFinal.winnerId === bracket.grandFinal.participant2Id}
                  $isTBD={!bracket.grandFinal.participant2Id}
                >
                  {getParticipantName(bracket.grandFinal.participant2Id)}
                  {bracket.grandFinal.participant2Id && ' (L)'}
                </ParticipantName>
                <Score $isWinner={bracket.grandFinal.winnerId === bracket.grandFinal.participant2Id}>
                  {bracket.grandFinal.status === 'completed' 
                    ? bracket.grandFinal.participant2Score 
                    : '-'}
                </Score>
              </ParticipantRow>
            </GrandFinalCard>
          </GrandFinalSection>
        </BracketSection>
      )}
    </Container>
  );
};

export default BracketView;
