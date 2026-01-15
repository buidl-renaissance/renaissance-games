import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { UserHeader } from '@/components/UserHeader';
import { utcToEstDisplay } from '@/lib/timezone';

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
  user?: { username: string | null; displayName: string | null; pfpUrl: string | null };
}

interface Team {
  id: string;
  name: string;
  captainId: string;
  isComplete: boolean;
  members?: { userId: string; user?: { username: string | null; displayName: string | null } }[];
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

// Layout
const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
`;

const Main = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`;

// Hero Section
const HeroSection = styled.div<{ $isLive?: boolean }>`
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme, $isLive }) => $isLive ? theme.live : theme.border};
  animation: ${fadeIn} 0.4s ease-out;
  
  ${({ $isLive }) => $isLive && `
    animation: ${subtleGlow} 3s ease-in-out infinite;
  `}
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0.5rem 0 0 0;
  letter-spacing: -0.02em;
`;

const RegDeadline = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
`;

const StartTime = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 0.25rem;
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin-top: 1.25rem;
  max-width: 600px;
`;

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const GameChip = styled.span`
  display: inline-flex;
  align-items: center;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  background: ${({ theme }) => theme.accentMuted};
  color: ${({ theme }) => theme.accent};
  border-radius: 4px;
  text-transform: capitalize;
`;

const HeroMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 80px;
`;

const HeroMetaLabel = styled.span`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const HeroMetaValue = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
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

const ParticipantAvatar = styled.div<{ $url?: string | null }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme, $url }) => $url ? `url(${$url}) center/cover` : theme.accentMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  flex-shrink: 0;
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

const ParticipantDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const ParticipantMembers = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
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

const AdminButton = styled(Link)`
  display: block;
  text-align: center;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  margin-top: 0.75rem;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  margin-top: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

// Team Creation/Join Components
const TeamSection = styled.div`
  margin-bottom: 1rem;
`;

const TeamLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.5rem;
`;

const TeamInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 16px;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
`;

const TeamToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.5rem;
  background: ${({ theme, $active }) => $active ? theme.accentMuted : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.accent : theme.textSecondary};
  border: 1px solid ${({ theme, $active }) => $active ? theme.accent : theme.border};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const OpenTeamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 1rem;
`;

const OpenTeamItem = styled.button<{ $selected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: ${({ theme, $selected }) => $selected ? theme.accentMuted : theme.backgroundAlt};
  border: 1px solid ${({ theme, $selected }) => $selected ? theme.accent : theme.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  
  &:hover {
    border-color: ${({ theme }) => theme.textSecondary};
  }
`;

const TeamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TeamName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const TeamMembers = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const TeamMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const NoTeamsText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  text-align: center;
  padding: 1rem;
  font-style: italic;
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

export default function TournamentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Team registration state
  const [teamMode, setTeamMode] = useState<'create' | 'join'>('create');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Organizer state
  const [additionalOrganizerIds, setAdditionalOrganizerIds] = useState<string[]>([]);

  const isAdditionalOrganizer = additionalOrganizerIds.includes(user?.id || '');
  const isOrganizer = user && tournament && (
    user.id === tournament.organizerId || 
    user.role === 'admin' ||
    isAdditionalOrganizer
  );
  
  // Check if user is registered (either directly or via a team)
  const userTeam = teams.find(t => 
    t.members?.some(m => m.userId === user?.id) || t.captainId === user?.id
  );
  const isRegistered = user && (
    participants.some(p => p.userId === user.id) || 
    userTeam !== undefined
  );
  const canRegister = tournament?.status === 'registration' || tournament?.status === 'ready';
  const isLive = tournament?.status === 'in_progress';
  
  // Teams that are looking for members (not complete)
  const openTeams = teams.filter(t => !t.isComplete);

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

  // Fetch organizers to check if user is an additional organizer
  useEffect(() => {
    const fetchOrganizers = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/tournaments/${id}/organizers`);
        if (res.ok) {
          const data = await res.json();
          const ids = (data.additionalOrganizers || []).map((o: { userId: string }) => o.userId);
          setAdditionalOrganizerIds(ids);
        }
      } catch (error) {
        console.error('Error fetching organizers:', error);
      }
    };
    fetchOrganizers();
  }, [id]);

  const handleRegister = async () => {
    if (!user || !tournament) return;
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build request body based on game type and mode
      let body: { teamName?: string; teamId?: string } = {};
      
      if (game?.isTeamGame) {
        if (teamMode === 'create') {
          if (!newTeamName.trim()) {
            throw new Error('Please enter a team name');
          }
          body = { teamName: newTeamName.trim() };
        } else if (teamMode === 'join') {
          if (!selectedTeamId) {
            throw new Error('Please select a team to join');
          }
          body = { teamId: selectedTeamId };
        }
      }

      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to register');

      // Handle different success scenarios
      if (game?.isTeamGame) {
        if (teamMode === 'create') {
          setSuccess(`Team "${newTeamName}" created! Waiting for a partner to join.`);
          setNewTeamName('');
        } else {
          setSuccess(data.message || 'Joined team successfully!');
          setSelectedTeamId(null);
        }
      } else {
        setSuccess(data.isWaitlisted 
          ? 'Added to waitlist. Awaiting confirmation.'
          : 'Entry confirmed.'
        );
      }
      
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

  const handleShare = async () => {
    const url = window.location.href;
    const title = tournament?.name || 'Tournament';
    const text = `Join ${title}!`;

    // Try native share first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to copy link');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return utcToEstDisplay(dateString) || 'TBD';
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(0)}`;
  };

  // Only show loading for data fetch
  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <UserHeader showBack backHref="/dashboard" />
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

      <UserHeader showBack backHref="/dashboard" />

      <Main>
        <HeroSection $isLive={isLive}>
          <GameChip>{game?.name || 'Tournament'}</GameChip>
          
          <Title>{tournament.name}</Title>
          
          {tournament.registrationDeadline && (
            <RegDeadline>Registration closes {formatDate(tournament.registrationDeadline)}</RegDeadline>
          )}
          
          {tournament.startTime && (
            <StartTime>{formatDate(tournament.startTime)}</StartTime>
          )}

          {tournament.location && (
            <StartTime>{tournament.location}</StartTime>
          )}
          
          {tournament.description && (
            <Description>{tournament.description}</Description>
          )}

          <HeroMeta>
            <HeroMetaItem>
              <HeroMetaLabel>Format</HeroMetaLabel>
              <HeroMetaValue>
                {tournament.eliminationType === 'double' ? 'Double Elim' : 'Single Elim'}
                {' · '}
                {tournament.bestOf === 1 ? 'Single Game' : `Bo${tournament.bestOf}`}
              </HeroMetaValue>
            </HeroMetaItem>
            <HeroMetaItem>
              <HeroMetaLabel>Entry / Prize</HeroMetaLabel>
              <HeroMetaValue>
                {formatCurrency(tournament.entryFee)}
                {tournament.prizePool && tournament.prizePool > 0 && (
                  <> / {formatCurrency(tournament.prizePool)}</>
                )}
              </HeroMetaValue>
            </HeroMetaItem>
          </HeroMeta>
        </HeroSection>

        <ContentGrid>
          <MainColumn>
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardBody>
                <ProgressContainer>
                  <ProgressHeader>
                    <ProgressLabel>Players Registered</ProgressLabel>
                    <ProgressValue>{participantCount}/{tournament.maxParticipants}</ProgressValue>
                  </ProgressHeader>
                  <ProgressBar>
                    <ProgressFill $percent={fillPercent} />
                  </ProgressBar>
                </ProgressContainer>

                {!game?.isTeamGame ? (
                  registeredParticipants.length > 0 ? (
                    <ParticipantList>
                      {registeredParticipants.slice(0, 10).map((p, index) => (
                        <ParticipantRow key={p.id}>
                          <ParticipantInfo>
                            <ParticipantRank>{index + 1}</ParticipantRank>
                            <ParticipantAvatar $url={p.user?.pfpUrl}>
                              {!p.user?.pfpUrl && getInitials(p.user?.displayName || p.user?.username)}
                            </ParticipantAvatar>
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
                ) : (
                  // Team game registration display
                  teams.length > 0 ? (
                    <>
                      {/* Complete teams */}
                      {teams.filter(t => t.isComplete).length > 0 && (
                        <ParticipantList>
                          {teams.filter(t => t.isComplete).map((team) => (
                            <ParticipantRow key={team.id}>
                              <ParticipantInfo>
                                <ParticipantDetails>
                                  <ParticipantName style={{ fontWeight: 500 }}>{team.name}</ParticipantName>
                                  <ParticipantMembers>
                                    {team.members?.map(m => m.user?.displayName || m.user?.username || 'Unknown').join(', ')}
                                  </ParticipantMembers>
                                </ParticipantDetails>
                              </ParticipantInfo>
                              <ParticipantBadge $type="ready">Ready</ParticipantBadge>
                            </ParticipantRow>
                          ))}
                        </ParticipantList>
                      )}
                      
                      {/* Teams looking for members */}
                      {teams.filter(t => !t.isComplete).length > 0 && (
                        <>
                          <CardTitle style={{ marginTop: teams.filter(t => t.isComplete).length > 0 ? '1.5rem' : 0, marginBottom: '0.75rem' }}>
                            Looking for Teammates
                          </CardTitle>
                          <ParticipantList>
                            {teams.filter(t => !t.isComplete).map((team) => (
                              <ParticipantRow key={team.id}>
                                <ParticipantInfo>
                                  <ParticipantDetails>
                                    <ParticipantName>{team.name}</ParticipantName>
                                    <ParticipantMembers>
                                      {team.members?.map(m => m.user?.displayName || m.user?.username || 'Unknown').join(', ')}
                                      {' · '}{team.members?.length || 0}/{game?.playersPerTeam} players
                                    </ParticipantMembers>
                                  </ParticipantDetails>
                                </ParticipantInfo>
                                <ParticipantBadge $type="waitlist">Forming</ParticipantBadge>
                              </ParticipantRow>
                            ))}
                          </ParticipantList>
                        </>
                      )}
                    </>
                  ) : (
                    <EmptyText>No teams registered. Be the first to enter.</EmptyText>
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
              <CardBody>
                {error && <Message $type="error">{error}</Message>}
                {success && <Message $type="success">{success}</Message>}
                
                {!user ? (
                  <EmptyText style={{ padding: 0 }}>Sign in to enter</EmptyText>
                ) : isRegistered ? (
                  <>
                    <RegisteredBadge>
                      ✓ {userTeam ? `Team: ${userTeam.name}${userTeam.isComplete ? '' : ' (waiting for partner)'}` : 'You have entered this tournament'}
                    </RegisteredBadge>
                    {canRegister && !userTeam?.isComplete && (
                      <WithdrawButton 
                        onClick={handleWithdraw} 
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Withdraw'}
                      </WithdrawButton>
                    )}
                  </>
                ) : canRegister ? (
                  <>
                    {/* Team game registration */}
                    {game?.isTeamGame && (
                      <>
                        <TeamToggle>
                          <ToggleButton 
                            $active={teamMode === 'create'}
                            onClick={() => setTeamMode('create')}
                          >
                            Create Team
                          </ToggleButton>
                          <ToggleButton 
                            $active={teamMode === 'join'}
                            onClick={() => setTeamMode('join')}
                          >
                            Join Team
                          </ToggleButton>
                        </TeamToggle>
                        
                        {teamMode === 'create' ? (
                          <TeamSection>
                            <TeamLabel>Team Name</TeamLabel>
                            <TeamInput
                              type="text"
                              placeholder="Enter team name..."
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                              maxLength={30}
                            />
                          </TeamSection>
                        ) : (
                          <TeamSection>
                            <TeamLabel>Join an open team</TeamLabel>
                            {openTeams.length > 0 ? (
                              <OpenTeamList>
                                {openTeams.map((team) => (
                                  <OpenTeamItem
                                    key={team.id}
                                    $selected={selectedTeamId === team.id}
                                    onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}
                                  >
                                    <TeamInfo>
                                    <TeamName>{team.name}</TeamName>
                                      <TeamMembers>
                                        {team.members?.map((m) => 
                                          m.user?.displayName || m.user?.username || 'Unknown'
                                        ).join(', ') || 'No members yet'}
                                      </TeamMembers>
                                    </TeamInfo>
                                    <TeamMeta>
                                      {team.members?.length || 1}/{game.playersPerTeam}
                                    </TeamMeta>
                                  </OpenTeamItem>
                                ))}
                              </OpenTeamList>
                            ) : (
                              <NoTeamsText>No teams looking for members</NoTeamsText>
                            )}
                          </TeamSection>
                        )}
                      </>
                    )}
                    
                    <EnterButton 
                      onClick={handleRegister} 
                      disabled={actionLoading || (game?.isTeamGame && teamMode === 'create' && !newTeamName.trim()) || (game?.isTeamGame && teamMode === 'join' && !selectedTeamId)}
                    >
                      {actionLoading 
                        ? 'Processing...' 
                        : game?.isTeamGame 
                          ? (teamMode === 'create' ? 'Create Team' : 'Join Team')
                          : (participantCount >= tournament.maxParticipants 
                              ? 'Join Waitlist' 
                              : 'Enter Tournament')
                      }
                    </EnterButton>
                  </>
                ) : (
                  <EmptyText style={{ padding: 0 }}>Registration closed</EmptyText>
                )}

                <ShareButton onClick={handleShare}>
                  Share Tournament
                </ShareButton>

                {isOrganizer && (
                  <AdminButton href={`/tournaments/${id}/admin`}>
                    Manage Tournament
                  </AdminButton>
                )}
              </CardBody>
            </ActionCard>

          </Sidebar>
        </ContentGrid>
      </Main>
    </Container>
  );
}
