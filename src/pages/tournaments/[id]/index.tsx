import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { PaymentPlaceholder } from '@/components/tournament/PaymentPlaceholder';

interface Tournament {
  id: string;
  gameId: string;
  organizerId: string;
  name: string;
  description: string | null;
  status: string;
  minParticipants: number;
  maxParticipants: number;
  eliminationType: string | null;
  entryFee: number | null;
  prizePool: number | null;
  prizeDistribution: Record<string, number> | null;
  bestOf: number;
  location: string | null;
  startTime: string | null;
  registrationDeadline: string | null;
}

interface Game {
  id: string;
  type: string;
  name: string;
  description: string;
  isTeamGame: boolean;
  playersPerTeam: number;
}

interface Participant {
  id: string;
  tournamentId: string;
  userId: string | null;
  teamId: string | null;
  status: string;
  seed: number | null;
}

interface Team {
  id: string;
  name: string;
  captainId: string;
  isComplete: boolean;
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const TournamentHeader = styled.div`
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2.25rem;
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
      case 'registration':
        return `background: ${theme.accent}20; color: ${theme.accent};`;
      case 'ready':
        return `background: ${theme.accentGold}30; color: ${theme.accentGold};`;
      case 'in_progress':
        return `background: #22c55e20; color: #22c55e;`;
      case 'completed':
        return `background: ${theme.textSecondary}20; color: ${theme.textSecondary};`;
      default:
        return `background: ${theme.border}; color: ${theme.textSecondary};`;
    }
  }}
`;

const GameBadge = styled.div`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Description = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin-top: 1rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const InfoValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const ParticipantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ParticipantItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
`;

const ParticipantName = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.text};
`;

const ParticipantStatus = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'waitlist':
        return `background: ${theme.accentGold}20; color: ${theme.accentGold};`;
      default:
        return `background: ${theme.accent}20; color: ${theme.accent};`;
    }
  }}
`;

const EmptyText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  font-style: italic;
  text-align: center;
  padding: 1rem;
`;

const ActionButton = styled.button`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  background: transparent;
  color: ${({ theme }) => theme.accent};
  border: 2px solid ${({ theme }) => theme.accent};
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accent}10;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AdminLink = styled(Link)`
  display: block;
  text-align: center;
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 1rem;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const BracketLink = styled(Link)`
  display: block;
  text-align: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.text};
  border-radius: 8px;
  margin-top: 1rem;
  
  &:hover {
    background: ${({ theme }) => theme.border};
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  background: #ef444420;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.p`
  color: #22c55e;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  background: #22c55e20;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const GAME_ICONS: Record<string, string> = {
  euchre: '🃏',
  pool: '🎱',
  chess: '♟️',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  ready: 'Ready to Start',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TournamentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: isUserLoading } = useUser();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOrganizer = user && tournament && (
    user.id === tournament.organizerId || 
    user.role === 'admin'
  );
  
  const isRegistered = user && participants.some(p => p.userId === user.id);
  const canRegister = tournament?.status === 'registration' || tournament?.status === 'ready';

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) {
        throw new Error('Tournament not found');
      }
      const data = await res.json();
      setTournament(data.tournament);
      setGame(data.game);
      setParticipants(data.participants || []);
      setTeams(data.teams || []);
      setParticipantCount(data.participantCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user || !tournament) return;
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setSuccess(data.isWaitlisted 
        ? 'Added to waitlist! You\'ll be notified if a spot opens.'
        : 'Successfully registered for the tournament!'
      );
      fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw from this tournament?')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to withdraw');
      }

      setSuccess('Successfully withdrawn from the tournament');
      fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(0)}`;
  };

  if (isLoading || isUserLoading) {
    return <Loading text="Loading tournament..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href="/tournaments">← Back to Tournaments</BackLink>
        </Header>
        <Main>
          <ErrorMessage>{error || 'Tournament not found'}</ErrorMessage>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>{tournament.name} | Renaissance City Games</title>
        <meta name="description" content={tournament.description || `${tournament.name} tournament`} />
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <BackLink href="/tournaments">← Back to Tournaments</BackLink>
      </Header>

      <Main>
        <TournamentHeader>
          <TitleRow>
            <div>
              <PageTitle>{tournament.name}</PageTitle>
              <GameBadge>
                <span>{game ? GAME_ICONS[game.type] || '🎮' : '🎮'}</span>
                {game?.name || 'Game'}
                {game?.isTeamGame && ` • ${game.playersPerTeam}v${game.playersPerTeam}`}
              </GameBadge>
            </div>
            <StatusBadge $status={tournament.status}>
              {STATUS_LABELS[tournament.status] || tournament.status}
            </StatusBadge>
          </TitleRow>
          {tournament.description && (
            <Description>{tournament.description}</Description>
          )}
        </TournamentHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <ContentGrid>
          <div>
            <Section>
              <SectionTitle>Tournament Details</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Format</InfoLabel>
                  <InfoValue>
                    {tournament.eliminationType 
                      ? `${tournament.eliminationType === 'double' ? 'Double' : 'Single'} Elimination`
                      : 'TBD'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Match Type</InfoLabel>
                  <InfoValue>
                    {tournament.bestOf === 1 ? 'Single Game' : `Best of ${tournament.bestOf}`}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Entry Fee</InfoLabel>
                  <InfoValue>{formatCurrency(tournament.entryFee)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Prize Pool</InfoLabel>
                  <InfoValue>
                    {tournament.prizePool && tournament.prizePool > 0 
                      ? formatCurrency(tournament.prizePool)
                      : 'None'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Location</InfoLabel>
                  <InfoValue>{tournament.location || 'TBD'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Start Time</InfoLabel>
                  <InfoValue>{formatDate(tournament.startTime)}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </Section>

            <Section style={{ marginTop: '1.5rem' }}>
              <SectionTitle>
                Participants ({participantCount}/{tournament.maxParticipants})
              </SectionTitle>
              
              {game?.isTeamGame ? (
                teams.length > 0 ? (
                  <ParticipantsList>
                    {teams.map((team, index) => (
                      <ParticipantItem key={team.id}>
                        <ParticipantName>
                          {index + 1}. {team.name}
                        </ParticipantName>
                        <ParticipantStatus $status={team.isComplete ? 'registered' : 'incomplete'}>
                          {team.isComplete ? 'Ready' : 'Forming'}
                        </ParticipantStatus>
                      </ParticipantItem>
                    ))}
                  </ParticipantsList>
                ) : (
                  <EmptyText>No teams registered yet</EmptyText>
                )
              ) : (
                participants.length > 0 ? (
                  <ParticipantsList>
                    {participants.map((p, index) => (
                      <ParticipantItem key={p.id}>
                        <ParticipantName>
                          {p.status === 'waitlist' ? 'W' : index + 1}. Player {p.userId?.slice(0, 8)}
                        </ParticipantName>
                        <ParticipantStatus $status={p.status}>
                          {p.status === 'waitlist' ? 'Waitlist' : 'Registered'}
                        </ParticipantStatus>
                      </ParticipantItem>
                    ))}
                  </ParticipantsList>
                ) : (
                  <EmptyText>No players registered yet</EmptyText>
                )
              )}

              {(tournament.status === 'ready' || tournament.status === 'in_progress') && (
                <BracketLink href={`/tournaments/${id}/bracket`}>
                  View Bracket →
                </BracketLink>
              )}
            </Section>
          </div>

          <div>
            <Section>
              <SectionTitle>Actions</SectionTitle>
              
              {!user ? (
                <EmptyText>Sign in to join this tournament</EmptyText>
              ) : isRegistered ? (
                <>
                  <SuccessMessage style={{ marginBottom: '1rem' }}>
                    You are registered!
                  </SuccessMessage>
                  {canRegister && (
                    <SecondaryButton 
                      onClick={handleWithdraw} 
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Withdraw'}
                    </SecondaryButton>
                  )}
                </>
              ) : canRegister ? (
                <ActionButton 
                  onClick={handleRegister} 
                  disabled={actionLoading || participantCount >= tournament.maxParticipants}
                >
                  {actionLoading 
                    ? 'Processing...' 
                    : participantCount >= tournament.maxParticipants 
                      ? 'Join Waitlist' 
                      : 'Register Now'}
                </ActionButton>
              ) : (
                <EmptyText>Registration is closed</EmptyText>
              )}

              {isOrganizer && (
                <AdminLink href={`/tournaments/${id}/admin`}>
                  Manage Tournament →
                </AdminLink>
              )}
            </Section>

            {((tournament.entryFee && tournament.entryFee > 0) || (tournament.prizePool && tournament.prizePool > 0)) && (
              <div style={{ marginTop: '1.5rem' }}>
                <PaymentPlaceholder
                  entryFee={tournament.entryFee}
                  prizePool={tournament.prizePool}
                  prizeDistribution={tournament.prizeDistribution}
                  participantCount={participantCount}
                  maxParticipants={tournament.maxParticipants}
                />
              </div>
            )}
          </div>
        </ContentGrid>
      </Main>
    </Container>
  );
}
