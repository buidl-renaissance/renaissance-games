import React, { useEffect, useState, useCallback } from 'react';
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
  user?: { username: string | null; displayName: string | null };
}

interface Team {
  id: string;
  name: string;
  captainId: string;
  isComplete: boolean;
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const subtleGlow = keyframes`
  0%, 100% { box-shadow: 0 0 30px rgba(123, 92, 255, 0.2); }
  50% { box-shadow: 0 0 50px rgba(123, 92, 255, 0.35); }
`;

const livePulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Layout
const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
`;

const Header = styled.header`
  padding: 1.25rem 2rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  letter-spacing: -0.02em;
`;

const BackLink = styled(Link)`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  transition: color 0.15s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Main = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
`;

// Hero Section
const HeroSection = styled.div<{ $isLive?: boolean }>`
  padding: 2.5rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme, $isLive }) => $isLive ? theme.live : theme.border};
  animation: ${fadeIn} 0.4s ease-out;
  
  ${({ $isLive }) => $isLive && `
    animation: ${subtleGlow} 3s ease-in-out infinite;
  `}
`;

const Breadcrumb = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  a {
    color: ${({ theme }) => theme.textMuted};
    
    &:hover {
      color: ${({ theme }) => theme.textSecondary};
    }
  }
`;

const GameLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  letter-spacing: -0.02em;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'registration':
        return `
          background: ${theme.accentMuted};
          color: ${theme.accent};
        `;
      case 'ready':
        return `
          background: ${theme.accentMuted};
          color: ${theme.accent};
        `;
      case 'in_progress':
        return `
          background: ${theme.liveGlow};
          color: ${theme.live};
        `;
      case 'completed':
        return `
          background: ${theme.surfaceHover};
          color: ${theme.text};
        `;
      default:
        return `
          background: ${theme.surfaceHover};
          color: ${theme.textMuted};
        `;
    }
  }}
`;

const LiveDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  background: ${({ theme }) => theme.live};
  border-radius: 50%;
  margin-right: 0.5rem;
  animation: ${livePulse} 1.5s ease-in-out infinite;
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin-top: 1.25rem;
  max-width: 600px;
`;

// Content Grid
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 800px) {
    order: -1;
  }
`;

// Cards
const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  animation: ${fadeIn} 0.4s ease-out 0.1s both;
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const CardTitle = styled.h3`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

const CardBody = styled.div`
  padding: 1.25rem;
`;

// Details Grid
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
`;

const DetailItem = styled.div``;

const DetailLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.35rem;
`;

const DetailValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

// Progress Bar
const ProgressContainer = styled.div`
  margin-bottom: 1rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ProgressValue = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ theme }) => theme.accent};
  border-radius: 2px;
  transition: width 0.5s ease;
`;

// Participants List
const ParticipantList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ParticipantRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ParticipantRank = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  width: 20px;
`;

const ParticipantName = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const ParticipantBadge = styled.span<{ $type: string }>`
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  text-transform: uppercase;
  
  ${({ $type, theme }) => $type === 'waitlist' ? `
    background: rgba(245, 158, 11, 0.15);
    color: ${theme.warning};
  ` : `
    background: rgba(34, 197, 94, 0.15);
    color: ${theme.success};
  `}
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  text-align: center;
  padding: 2rem 1rem;
  font-style: italic;
`;

// Action Card
const ActionCard = styled(Card)<{ $accent?: boolean }>`
  ${({ $accent, theme }) => $accent && `
    border-color: ${theme.accent};
  `}
`;

const EnterButton = styled.button`
  width: 100%;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.875rem 1.5rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WithdrawButton = styled.button`
  width: 100%;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.danger};
    color: ${({ theme }) => theme.danger};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RegisteredBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.success};
  margin-bottom: 1rem;
`;

const AdminLink = styled(Link)`
  display: block;
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 0.75rem;
  transition: color 0.15s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const BracketLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.text};
  border-radius: 6px;
  margin-top: 1rem;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

// Messages
const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 0.875rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  
  ${({ $type, theme }) => $type === 'success' ? `
    background: rgba(34, 197, 94, 0.1);
    color: ${theme.success};
    border: 1px solid rgba(34, 197, 94, 0.2);
  ` : `
    background: rgba(239, 68, 68, 0.1);
    color: ${theme.danger};
    border: 1px solid rgba(239, 68, 68, 0.2);
  `}
`;

// Game-specific naming
const GAME_NAMES: Record<string, string> = {
  euchre: 'Deal Into the Void',
  pool: 'Break Into the Void',
  chess: 'Endgame: Into the Void',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Pending',
  registration: 'Open',
  ready: 'Begin',
  in_progress: 'Live',
  completed: 'Finished',
  cancelled: 'Void',
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
  const isLive = tournament?.status === 'in_progress';

  const fetchTournament = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error('Tournament not found');
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
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

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

      if (!res.ok) throw new Error(data.error || 'Failed to register');

      setSuccess(data.isWaitlisted 
        ? 'Added to waitlist. Awaiting confirmation.'
        : 'Entry confirmed.'
      );
      fetchTournament();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Withdraw from this tournament?')) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw');

      setSuccess('Withdrawn from tournament.');
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
    return <Loading text="Loading..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href="/tournaments">← Back</BackLink>
        </Header>
        <Main>
          <Message $type="error">{error || 'Tournament not found'}</Message>
        </Main>
      </Container>
    );
  }

  const registeredParticipants = participants.filter(p => p.status === 'registered');
  const fillPercent = Math.min((participantCount / tournament.maxParticipants) * 100, 100);

  return (
    <Container>
      <Head>
        <title>{tournament.name} | Renaissance City</title>
        <meta name="description" content={tournament.description || `${tournament.name} tournament`} />
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <BackLink href="/tournaments">← Tournaments</BackLink>
      </Header>

      <Main>
        <HeroSection $isLive={isLive}>
          <Breadcrumb>
            <Link href="/tournaments">Tournaments</Link> / {tournament.name}
          </Breadcrumb>
          
          <GameLabel>
            {GAME_NAMES[game?.type || ''] || game?.name || 'Tournament'}
          </GameLabel>
          
          <TitleRow>
            <Title>{tournament.name}</Title>
            <StatusBadge $status={tournament.status}>
              {isLive && <LiveDot />}
              {STATUS_LABELS[tournament.status] || tournament.status}
            </StatusBadge>
          </TitleRow>
          
          {tournament.description && (
            <Description>{tournament.description}</Description>
          )}
        </HeroSection>

        <ContentGrid>
          <MainColumn>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardBody>
                <DetailsGrid>
                  <DetailItem>
                    <DetailLabel>Format</DetailLabel>
                    <DetailValue>
                      {tournament.eliminationType === 'double' ? 'Double Elimination' : 'Single Elimination'}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Match</DetailLabel>
                    <DetailValue>
                      {tournament.bestOf === 1 ? 'Single Game' : `Best of ${tournament.bestOf}`}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Entry</DetailLabel>
                    <DetailValue>{formatCurrency(tournament.entryFee)}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Prize</DetailLabel>
                    <DetailValue>
                      {tournament.prizePool && tournament.prizePool > 0 
                        ? formatCurrency(tournament.prizePool)
                        : '—'}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Location</DetailLabel>
                    <DetailValue>{tournament.location || 'TBD'}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Start</DetailLabel>
                    <DetailValue>{formatDate(tournament.startTime)}</DetailValue>
                  </DetailItem>
                </DetailsGrid>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {game?.isTeamGame ? 'Teams' : 'Players'}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <ProgressContainer>
                  <ProgressHeader>
                    <ProgressLabel>Registered</ProgressLabel>
                    <ProgressValue>{participantCount}/{tournament.maxParticipants}</ProgressValue>
                  </ProgressHeader>
                  <ProgressBar>
                    <ProgressFill $percent={fillPercent} />
                  </ProgressBar>
                </ProgressContainer>
                
                {game?.isTeamGame ? (
                  teams.length > 0 ? (
                    <ParticipantList>
                      {teams.map((team, index) => (
                        <ParticipantRow key={team.id}>
                          <ParticipantInfo>
                            <ParticipantRank>{index + 1}</ParticipantRank>
                            <ParticipantName>{team.name}</ParticipantName>
                          </ParticipantInfo>
                          <ParticipantBadge $type={team.isComplete ? 'ready' : 'waitlist'}>
                            {team.isComplete ? 'Ready' : 'Forming'}
                          </ParticipantBadge>
                        </ParticipantRow>
                      ))}
                    </ParticipantList>
                  ) : (
                    <EmptyText>No teams registered. Be the first to enter.</EmptyText>
                  )
                ) : (
                  registeredParticipants.length > 0 ? (
                    <ParticipantList>
                      {registeredParticipants.slice(0, 10).map((p, index) => (
                        <ParticipantRow key={p.id}>
                          <ParticipantInfo>
                            <ParticipantRank>{index + 1}</ParticipantRank>
                            <ParticipantName>
                              {p.user?.displayName || p.user?.username || `Player ${p.userId?.slice(0, 6)}`}
                            </ParticipantName>
                          </ParticipantInfo>
                          <ParticipantBadge $type="ready">Entered</ParticipantBadge>
                        </ParticipantRow>
                      ))}
                      {registeredParticipants.length > 10 && (
                        <EmptyText style={{ padding: '0.5rem', fontStyle: 'normal' }}>
                          + {registeredParticipants.length - 10} more
                        </EmptyText>
                      )}
                    </ParticipantList>
                  ) : (
                    <EmptyText>No players registered. Be the first to enter.</EmptyText>
                  )
                )}

                {(tournament.status === 'ready' || tournament.status === 'in_progress') && (
                  <BracketLink href={`/tournaments/${id}/bracket`}>
                    View Bracket →
                  </BracketLink>
                )}
              </CardBody>
            </Card>
          </MainColumn>

          <Sidebar>
            <ActionCard $accent={canRegister && !isRegistered}>
              <CardHeader>
                <CardTitle>Action</CardTitle>
              </CardHeader>
              <CardBody>
                {error && <Message $type="error">{error}</Message>}
                {success && <Message $type="success">{success}</Message>}
                
                {!user ? (
                  <EmptyText style={{ padding: 0 }}>Sign in to enter</EmptyText>
                ) : isRegistered ? (
                  <>
                    <RegisteredBadge>
                      ✓ You have entered this tournament
                    </RegisteredBadge>
                    {canRegister && (
                      <WithdrawButton 
                        onClick={handleWithdraw} 
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Withdraw'}
                      </WithdrawButton>
                    )}
                  </>
                ) : canRegister ? (
                  <EnterButton 
                    onClick={handleRegister} 
                    disabled={actionLoading}
                  >
                    {actionLoading 
                      ? 'Processing...' 
                      : participantCount >= tournament.maxParticipants 
                        ? 'Join Waitlist' 
                        : 'Enter Tournament'}
                  </EnterButton>
                ) : (
                  <EmptyText style={{ padding: 0 }}>Registration closed</EmptyText>
                )}

                {isOrganizer && (
                  <AdminLink href={`/tournaments/${id}/admin`}>
                    Manage Tournament →
                  </AdminLink>
                )}
              </CardBody>
            </ActionCard>

            {((tournament.entryFee && tournament.entryFee > 0) || (tournament.prizePool && tournament.prizePool > 0)) && (
              <PaymentPlaceholder
                entryFee={tournament.entryFee}
                prizePool={tournament.prizePool}
                prizeDistribution={tournament.prizeDistribution}
                participantCount={participantCount}
                maxParticipants={tournament.maxParticipants}
              />
            )}

            {tournament.startTime && (
              <Card>
                <CardBody>
                  <DetailItem>
                    <DetailLabel>Tournament Begins</DetailLabel>
                    <DetailValue style={{ fontSize: '0.9rem' }}>
                      {formatDate(tournament.startTime)}
                    </DetailValue>
                  </DetailItem>
                  {tournament.registrationDeadline && (
                    <DetailItem style={{ marginTop: '1rem' }}>
                      <DetailLabel>Registration Closes</DetailLabel>
                      <DetailValue style={{ fontSize: '0.9rem' }}>
                        {formatDate(tournament.registrationDeadline)}
                      </DetailValue>
                    </DetailItem>
                  )}
                </CardBody>
              </Card>
            )}
          </Sidebar>
        </ContentGrid>
      </Main>
    </Container>
  );
}
