import React, { useEffect, useState } from 'react';
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  padding: 1.5rem 2rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
`;

const BackLink = styled(Link)`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Main = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'in_progress':
        return `background: #22c55e20; color: #22c55e;`;
      case 'completed':
        return `background: ${theme.textSecondary}20; color: ${theme.textSecondary};`;
      default:
        return `background: ${theme.accentGold}20; color: ${theme.accentGold};`;
    }
  }}
`;

const BreadcrumbNav = styled.nav`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 1rem;
  
  a {
    color: ${({ theme }) => theme.textSecondary};
    
    &:hover {
      color: ${({ theme }) => theme.text};
    }
  }
`;

const BracketContainer = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
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
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  padding: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ParticipantOption = styled.button<{ $selected?: boolean }>`
  width: 100%;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: ${({ theme, $selected }) => $selected ? `${theme.accent}20` : theme.backgroundAlt};
  border: 2px solid ${({ theme, $selected }) => $selected ? theme.accent : theme.border};
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const ParticipantOptionName = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const ScoreInput = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
`;

const ScoreLabel = styled.label`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  flex: 1;
`;

const ScoreField = styled.input`
  width: 60px;
  padding: 0.5rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
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
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ theme, $primary }) => $primary ? `
    background: linear-gradient(135deg, ${theme.accent}, ${theme.accentGold});
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
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
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
`;

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready to Start',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function BracketPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: isUserLoading } = useUser();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<BracketVisualization | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
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

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
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
        setMatches(data.matches || []);
      }
    } catch (err) {
      setError('Failed to load bracket');
      console.error('Error fetching bracket:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading || isUserLoading) {
    return <Loading text="Loading bracket..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href="/tournaments">← Tournaments</BackLink>
        </Header>
        <Main>
          <EmptyState>
            <EmptyTitle>Tournament Not Found</EmptyTitle>
            <EmptyText>The tournament you're looking for doesn't exist.</EmptyText>
          </EmptyState>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>Bracket - {tournament.name} | Renaissance City Games</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <BackLink href={`/tournaments/${id}`}>← Back to Tournament</BackLink>
      </Header>

      <Main>
        <PageHeader>
          <BreadcrumbNav>
            <Link href="/tournaments">Tournaments</Link> / <Link href={`/tournaments/${id}`}>{tournament.name}</Link> / Bracket
          </BreadcrumbNav>
          <TitleRow>
            <PageTitle>{tournament.name} - Bracket</PageTitle>
            <StatusBadge $status={tournament.status}>
              {STATUS_LABELS[tournament.status] || tournament.status}
            </StatusBadge>
          </TitleRow>
        </PageHeader>

        {error ? (
          <EmptyState>
            <EmptyTitle>Error</EmptyTitle>
            <EmptyText>{error}</EmptyText>
          </EmptyState>
        ) : !bracket ? (
          <EmptyState>
            <EmptyTitle>Bracket Not Generated</EmptyTitle>
            <EmptyText>The bracket hasn't been generated yet. Check back when the tournament starts.</EmptyText>
          </EmptyState>
        ) : (
          <BracketContainer>
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
              <ScoreLabel>Select Winner:</ScoreLabel>
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
              <ScoreLabel>Scores:</ScoreLabel>
              <ScoreInput>
                <span>{getParticipantName(selectedMatch.participant1Id)}</span>
                <ScoreField
                  type="number"
                  min="0"
                  value={p1Score}
                  onChange={e => setP1Score(e.target.value)}
                />
              </ScoreInput>
              <ScoreInput>
                <span>{getParticipantName(selectedMatch.participant2Id)}</span>
                <ScoreField
                  type="number"
                  min="0"
                  value={p2Score}
                  onChange={e => setP2Score(e.target.value)}
                />
              </ScoreInput>
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
