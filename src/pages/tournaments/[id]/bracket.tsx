import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import BracketView from '@/components/tournament/BracketView';

interface Tournament {
  id: string;
  name: string;
  status: string;
  eliminationType: string | null;
}

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

interface Participant {
  id: string;
  userId: string | null;
  teamId: string | null;
}

interface Team {
  id: string;
  name: string;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 12px ${({ theme }) => theme.accentGlow}; }
  50% { box-shadow: 0 0 24px ${({ theme }) => theme.accentGlow}; }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const BackLink = styled(Link)`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const BreadcrumbNav = styled.nav`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
  
  a {
    color: ${({ theme }) => theme.textMuted};
    
    &:hover {
      color: ${({ theme }) => theme.text};
    }
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleSection = styled.div``;

const PageTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  display: block;
  margin-top: 0.35rem;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'in_progress':
        return `
          background: ${theme.accentMuted}; 
          color: ${theme.accent};
          animation: ${pulseGlow} 2s ease-in-out infinite;
        `;
      case 'completed':
        return `background: ${theme.steelGray}; color: ${theme.textMuted};`;
      default:
        return `background: rgba(34, 197, 94, 0.1); color: #22c55e;`;
    }
  }}
`;

const BracketContainer = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
  overflow: hidden;
`;

const BracketHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BracketTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const EliminationBadge = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.backgroundAlt};
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
`;

const MatchModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  max-width: 400px;
  width: 100%;
  padding: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ModalLabel = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ParticipantOption = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: ${({ theme, $selected }) => $selected ? theme.accentMuted : theme.backgroundAlt};
  border: 1px solid ${({ theme, $selected }) => $selected ? theme.accent : theme.border};
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ParticipantOptionName = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const ScoreInputRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ScorePlayerName = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.text};
`;

const ScoreField = styled.input`
  width: 60px;
  padding: 0.5rem;
  text-align: center;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  
  ${({ theme, $primary }) => $primary ? `
    background: ${theme.accent};
    color: ${theme.signalWhite};
    border: none;
    
    &:hover:not(:disabled) {
      background: ${theme.accentHover};
      transform: translateY(-2px);
      box-shadow: 0 8px 24px ${theme.accentGlow};
    }
  ` : `
    background: transparent;
    color: ${theme.text};
    border: 1px solid ${theme.border};
    
    &:hover {
      background: ${theme.backgroundAlt};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.infraRed};
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: rgba(225, 75, 75, 0.1);
  border-radius: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 1.5rem;
  opacity: 0.5;
`;

const EmptyTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
`;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Open',
  ready: 'Ready',
  in_progress: 'Live',
  completed: 'Done',
  cancelled: 'Void',
};

export default function BracketPage() {
  const router = useRouter();
  const { id } = router.query;
  useUser();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<BracketVisualization | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [p1Score, setP1Score] = useState('0');
  const [p2Score, setP2Score] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const [tournamentRes, bracketRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch(`/api/tournaments/${id}/bracket`),
      ]);

      if (tournamentRes.ok) {
        const data = await tournamentRes.json();
        setTournament(data.tournament);
        setParticipants(data.participants || []);
        setTeams(data.teams || []);
      }

      if (bracketRes.ok) {
        const data = await bracketRes.json();
        setBracket(data.bracket);
      }
    } catch (err) {
      setError('Failed to load bracket');
      console.error('Error fetching bracket:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMatchClick = (match: Match) => {
    if (match.status === 'ready' || match.status === 'in_progress' || match.status === 'awaiting_confirmation') {
      setSelectedMatch(match);
      setSelectedWinner(null);
      setP1Score('0');
      setP2Score('0');
      setSubmitError(null);
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch || !selectedWinner) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: selectedWinner,
          participant1Score: parseInt(p1Score, 10),
          participant2Score: parseInt(p2Score, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit result');
      }

      // Close modal and refresh
      setSelectedMatch(null);
      fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit result');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build participant name lookup
  const participantMap = new Map<string, { id: string; name: string; isTeam?: boolean }>();
  
  participants.forEach(p => {
    if (p.teamId) {
      const team = teams.find(t => t.id === p.teamId);
      participantMap.set(p.id, {
        id: p.id,
        name: team?.name || `Team ${p.teamId.slice(0, 6)}`,
        isTeam: true,
      });
    } else {
      participantMap.set(p.id, {
        id: p.id,
        name: `Player ${p.userId?.slice(0, 6) || 'Unknown'}`,
        isTeam: false,
      });
    }
  });

  const getParticipantName = (participantId: string | null): string => {
    if (!participantId) return 'TBD';
    return participantMap.get(participantId)?.name || 'Unknown';
  };

  if (isLoading) {
    return <Loading text="Loading bracket..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Into the Void</Logo>
          <BackLink href="/tournaments">← Tournaments</BackLink>
        </Header>
        <Main>
          <EmptyState>
            <EmptyIcon>×</EmptyIcon>
            <EmptyTitle>Tournament Not Found</EmptyTitle>
            <EmptyText>The tournament you&apos;re looking for doesn&apos;t exist.</EmptyText>
          </EmptyState>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>Bracket — {tournament.name} | Into the Void</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Into the Void</Logo>
        <BackLink href={`/tournaments/${id}`}>← Back to Tournament</BackLink>
      </Header>

      <Main>
        <PageHeader>
          <BreadcrumbNav>
            <Link href="/tournaments">Tournaments</Link>
            {' / '}
            <Link href={`/tournaments/${id}`}>{tournament.name}</Link>
            {' / '}
            Bracket
          </BreadcrumbNav>
          <TitleRow>
            <TitleSection>
              <PageTitle>Tournament Bracket</PageTitle>
              <Subtitle>{tournament.name}</Subtitle>
            </TitleSection>
            <StatusBadge $status={tournament.status}>
              {STATUS_LABELS[tournament.status] || tournament.status}
            </StatusBadge>
          </TitleRow>
        </PageHeader>

        {error ? (
          <EmptyState>
            <EmptyIcon>!</EmptyIcon>
            <EmptyTitle>Error</EmptyTitle>
            <EmptyText>{error}</EmptyText>
          </EmptyState>
        ) : !bracket ? (
          <EmptyState>
            <EmptyIcon>○</EmptyIcon>
            <EmptyTitle>Bracket Not Generated</EmptyTitle>
            <EmptyText>The bracket hasn&apos;t been generated yet. Check back when the tournament begins.</EmptyText>
          </EmptyState>
        ) : (
          <BracketContainer>
            <BracketHeader>
              <BracketTitle>Bracket View</BracketTitle>
              <EliminationBadge>
                {tournament.eliminationType === 'double' ? 'Double Elimination' : 'Single Elimination'}
              </EliminationBadge>
            </BracketHeader>
            <BracketView
              bracket={bracket}
              participants={participantMap}
              eliminationType={(tournament.eliminationType as 'single' | 'double') || 'single'}
              onMatchClick={handleMatchClick}
            />
          </BracketContainer>
        )}
      </Main>

      {/* Result Submission Modal */}
      {selectedMatch && (
        <MatchModal onClick={() => setSelectedMatch(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Submit Match Result</ModalTitle>
            
            <ModalSection>
              <ModalLabel>Select Winner</ModalLabel>
              {selectedMatch.participant1Id && (
                <ParticipantOption
                  $selected={selectedWinner === selectedMatch.participant1Id}
                  onClick={() => setSelectedWinner(selectedMatch.participant1Id)}
                >
                  <ParticipantOptionName>
                    {getParticipantName(selectedMatch.participant1Id)}
                  </ParticipantOptionName>
                </ParticipantOption>
              )}
              {selectedMatch.participant2Id && (
                <ParticipantOption
                  $selected={selectedWinner === selectedMatch.participant2Id}
                  onClick={() => setSelectedWinner(selectedMatch.participant2Id)}
                >
                  <ParticipantOptionName>
                    {getParticipantName(selectedMatch.participant2Id)}
                  </ParticipantOptionName>
                </ParticipantOption>
              )}
            </ModalSection>

            <ModalSection>
              <ModalLabel>Final Score</ModalLabel>
              <ScoreInputRow>
                <ScorePlayerName>{getParticipantName(selectedMatch.participant1Id)}</ScorePlayerName>
                <ScoreField
                  type="number"
                  min="0"
                  value={p1Score}
                  onChange={e => setP1Score(e.target.value)}
                />
              </ScoreInputRow>
              <ScoreInputRow>
                <ScorePlayerName>{getParticipantName(selectedMatch.participant2Id)}</ScorePlayerName>
                <ScoreField
                  type="number"
                  min="0"
                  value={p2Score}
                  onChange={e => setP2Score(e.target.value)}
                />
              </ScoreInputRow>
            </ModalSection>

            {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

            <ModalButtons>
              <ModalButton onClick={() => setSelectedMatch(null)}>
                Cancel
              </ModalButton>
              <ModalButton
                $primary
                onClick={handleSubmitResult}
                disabled={!selectedWinner || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Result'}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </MatchModal>
      )}
    </Container>
  );
}
