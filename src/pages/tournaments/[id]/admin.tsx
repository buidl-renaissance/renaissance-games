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
  bestOf: number;
  location: string | null;
  startTime: string | null;
  registrationDeadline: string | null;
  publishedEventId: number | null;
}

interface Game {
  id: string;
  type: string;
  name: string;
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

interface TeamMember {
  userId: string;
  user: {
    id: string;
    displayName: string | null;
    username: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  captainId: string;
  isComplete: boolean;
  members?: TeamMember[];
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Layout
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
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`;

// Page Header
const PageHeader = styled.div`
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
`;

const TitleGroup = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem 0;
`;

const PageSubtitle = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
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
      case 'draft':
        return `background: ${theme.surfaceHover}; color: ${theme.textMuted};`;
      case 'registration':
        return `background: ${theme.accentMuted}; color: ${theme.accent};`;
      case 'ready':
        return `background: ${theme.accentMuted}; color: ${theme.accent};`;
      case 'in_progress':
        return `background: ${theme.liveGlow}; color: ${theme.live};`;
      case 'completed':
        return `background: ${theme.surfaceHover}; color: ${theme.text};`;
      default:
        return `background: ${theme.surfaceHover}; color: ${theme.textMuted};`;
    }
  }}
`;

const EditButton = styled(Link)`
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: transparent;
  color: ${({ theme }) => theme.textSecondary};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  transition: all 0.15s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.textSecondary};
  }
`;

// Tabs
const TabsContainer = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.875rem 1.25rem;
  color: ${({ theme, $active }) => $active ? theme.text : theme.textMuted};
  background: transparent;
  border: none;
  position: relative;
  transition: color 0.15s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ theme, $active }) => $active ? theme.accent : 'transparent'};
    transition: background 0.15s ease;
  }
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const TabContent = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

// Stats Grid
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
`;

// Cards
const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

// Action Buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.625rem 1.125rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  ${({ theme, $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.accent};
          color: white;
          border: none;
          &:hover:not(:disabled) {
            background: ${theme.accentHover};
            transform: translateY(-1px);
          }
        `;
      case 'success':
        return `
          background: ${theme.success};
          color: white;
          border: none;
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
      case 'danger':
        return `
          background: ${theme.danger};
          color: white;
          border: none;
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
      default:
        return `
          background: transparent;
          color: ${theme.text};
          border: 1px solid ${theme.border};
          &:hover:not(:disabled) {
            background: ${theme.surfaceHover};
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LinkButton = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.625rem 1.125rem;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

// Participants
const ParticipantList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ParticipantRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: ${({ theme, $selected }) => $selected ? theme.accentMuted : 'transparent'};
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
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
  width: 24px;
`;

const ParticipantName = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const ParticipantBadge = styled.span<{ $status: string }>`
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  text-transform: uppercase;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'waitlist':
        return `background: rgba(245, 158, 11, 0.15); color: ${theme.warning};`;
      case 'checked_in':
      case 'registered':
        return `background: rgba(34, 197, 94, 0.15); color: ${theme.success};`;
      default:
        return `background: ${theme.accentMuted}; color: ${theme.accent};`;
    }
  }}
`;

const TeamRowContainer = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  
  &:last-child {
    border-bottom: none;
  }
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: transparent;
  transition: background 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const TeamMembersList = styled.div`
  padding: 0 1rem 0.75rem 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TeamMemberChip = styled.span`
  font-size: 0.8rem;
  padding: 0.25rem 0.625rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.textSecondary};
`;

// Team Pairing
const TeamPairingSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const PairingTitle = styled.h4`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
`;

const PairingRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
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

// Info Box
const InfoBox = styled.div<{ $type?: 'info' | 'warning' | 'success' | 'error' }>`
  padding: 0.875rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  
  ${({ $type, theme }) => {
    switch ($type) {
      case 'warning':
        return `background: rgba(245, 158, 11, 0.1); color: ${theme.warning}; border: 1px solid rgba(245, 158, 11, 0.2);`;
      case 'success':
        return `background: rgba(34, 197, 94, 0.1); color: ${theme.success}; border: 1px solid rgba(34, 197, 94, 0.2);`;
      case 'error':
        return `background: rgba(239, 68, 68, 0.1); color: ${theme.danger}; border: 1px solid rgba(239, 68, 68, 0.2);`;
      default:
        return `background: ${theme.surfaceHover}; color: ${theme.textSecondary}; border: 1px solid ${theme.border};`;
    }
  }}
`;

// Empty State
const EmptyText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  text-align: center;
  padding: 2rem 1rem;
  font-style: italic;
`;

// Access Denied
const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const AccessTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

// Details Grid
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const DetailItem = styled.div``;

const DetailLabel = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

// Game naming
const GAME_NAMES: Record<string, string> = {
  euchre: 'Deal Into the Void',
  pool: 'Break Into the Void',
  chess: 'Endgame: Into the Void',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Open',
  ready: 'Ready',
  in_progress: 'Live',
  completed: 'Done',
  cancelled: 'Void',
};

type TabType = 'overview' | 'participants' | 'actions';

export default function TournamentAdminPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [waitlist, setWaitlist] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');

  // Organizer state
  const [additionalOrganizerIds, setAdditionalOrganizerIds] = useState<string[]>([]);

  const isAdditionalOrganizer = additionalOrganizerIds.includes(user?.id || '');
  const isOrganizer = user && tournament && (
    user.id === tournament.organizerId || 
    user.role === 'admin' ||
    isAdditionalOrganizer
  );

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data.tournament);
        setGame(data.game);
        setParticipants(data.participants || []);
        setTeams(data.teams || []);
        setWaitlist(data.waitlist || []);
        setParticipantCount(data.participantCount || 0);
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setMessage({ type: 'success', text: `Status updated to ${STATUS_LABELS[status]}` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  const generateBracket = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/bracket`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate bracket');

      setMessage({ type: 'success', text: 'Bracket generated' });
      router.push(`/tournaments/${id}/bracket`);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to generate bracket' });
    } finally {
      setActionLoading(false);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim() || selectedPlayers.length !== (game?.playersPerTeam || 2)) {
      setMessage({ type: 'error', text: `Select ${game?.playersPerTeam || 2} players and enter team name` });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: id, teamName, memberIds: selectedPlayers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      setMessage({ type: 'success', text: `Team "${teamName}" created` });
      setTeamName('');
      setSelectedPlayers([]);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create team' });
    } finally {
      setActionLoading(false);
    }
  };

  const togglePlayerSelection = (participantId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(participantId)) return prev.filter(pid => pid !== participantId);
      if (prev.length < (game?.playersPerTeam || 2)) return [...prev, participantId];
      return prev;
    });
  };

  const publishToRenaissanceEvents = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/publish-event`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish event');

      setMessage({ 
        type: 'success', 
        text: data.message || 'Published to Renaissance Events' 
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to publish' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return utcToEstDisplay(dateString) || '—';
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return '$0';
    return `$${(cents / 100).toFixed(0)}`;
  };

  // Only show loading for data fetch
  if (isLoading) return <Loading text="Loading..." />;

  if (!tournament) {
    return (
      <Container>
        <UserHeader showBack backHref="/dashboard" />
        <Main>
          <InfoBox $type="error">Tournament not found</InfoBox>
        </Main>
      </Container>
    );
  }

  if (!isOrganizer) {
    return (
      <Container>
        <UserHeader showBack backHref={`/tournaments/${id}`} />
        <Main>
          <AccessDenied>
            <AccessTitle>Access Denied</AccessTitle>
            <EmptyText>Only organizers can access this page.</EmptyText>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  const canOpenRegistration = tournament.status === 'draft';
  const canGenerateBracket = (tournament.status === 'registration' || tournament.status === 'ready') && 
    participantCount >= tournament.minParticipants;
  const canStartTournament = tournament.status === 'ready';
  const canCompleteTournament = tournament.status === 'in_progress';
  const isLocked = tournament.status === 'completed' || tournament.status === 'cancelled';

  const unassignedPlayers = participants.filter(p => !p.teamId && p.status !== 'waitlist');
  const registeredParticipants = participants.filter(p => p.status === 'registered');

  return (
    <Container>
      <Head>
        <title>Manage {tournament.name} | Renaissance City</title>
      </Head>

      <UserHeader showBack backHref={`/tournaments/${id}`} />

      <Main>
        <PageHeader>
          <TitleRow>
            <TitleGroup>
              <PageTitle>{tournament.name}</PageTitle>
              <PageSubtitle>
                {GAME_NAMES[game?.type || ''] || game?.name || 'Tournament'}
              </PageSubtitle>
            </TitleGroup>
            <HeaderActions>
              <StatusBadge $status={tournament.status}>
                {STATUS_LABELS[tournament.status]}
              </StatusBadge>
              {!isLocked && (
                <EditButton href={`/tournaments/${id}/edit`}>Edit</EditButton>
              )}
            </HeaderActions>
          </TitleRow>
        </PageHeader>

        {message && (
          <InfoBox $type={message.type}>{message.text}</InfoBox>
        )}

        <TabsContainer>
          <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </Tab>
          <Tab $active={activeTab === 'participants'} onClick={() => setActiveTab('participants')}>
            Participants ({participantCount})
          </Tab>
          <Tab $active={activeTab === 'actions'} onClick={() => setActiveTab('actions')}>
            Actions
          </Tab>
        </TabsContainer>

        <TabContent>
          {activeTab === 'overview' && (
            <>
              <StatsGrid>
                <StatCard>
                  <StatValue>{participantCount}/{tournament.maxParticipants}</StatValue>
                  <StatLabel>Registered</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{teams.length || '—'}</StatValue>
                  <StatLabel>Teams</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{waitlist.length}</StatValue>
                  <StatLabel>Waitlist</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{formatCurrency(tournament.prizePool)}</StatValue>
                  <StatLabel>Prize</StatLabel>
                </StatCard>
              </StatsGrid>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  {!isLocked && <LinkButton href={`/tournaments/${id}/edit`}>Edit</LinkButton>}
                </CardHeader>
                <CardBody>
                  <DetailsGrid>
                    <DetailItem>
                      <DetailLabel>Format</DetailLabel>
                      <DetailValue>
                        {tournament.eliminationType === 'double' ? 'Double Elim' : 'Single Elim'}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Match</DetailLabel>
                      <DetailValue>Best of {tournament.bestOf}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Entry</DetailLabel>
                      <DetailValue>{formatCurrency(tournament.entryFee)}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Location</DetailLabel>
                      <DetailValue>{tournament.location || '—'}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Start</DetailLabel>
                      <DetailValue>{formatDate(tournament.startTime)}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Deadline</DetailLabel>
                      <DetailValue>{formatDate(tournament.registrationDeadline)}</DetailValue>
                    </DetailItem>
                  </DetailsGrid>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardBody>
                  <ActionButtons>
                    {canOpenRegistration && (
                      <ActionButton $variant="primary" onClick={() => updateStatus('registration')} disabled={actionLoading}>
                        Open Registration
                      </ActionButton>
                    )}
                    {canGenerateBracket && (
                      <ActionButton $variant="primary" onClick={generateBracket} disabled={actionLoading}>
                        Generate Bracket
                      </ActionButton>
                    )}
                    {canStartTournament && (
                      <ActionButton $variant="success" onClick={() => updateStatus('in_progress')} disabled={actionLoading}>
                        Begin Tournament
                      </ActionButton>
                    )}
                    {(tournament.status === 'ready' || tournament.status === 'in_progress') && (
                      <LinkButton href={`/tournaments/${id}/bracket`}>View Bracket</LinkButton>
                    )}
                    <LinkButton href={`/tournaments/${id}`}>Public Page</LinkButton>
                  </ActionButtons>

                  {tournament.status === 'draft' && (
                    <InfoBox style={{ marginTop: '1rem' }}>
                      Open registration to allow players to enter.
                    </InfoBox>
                  )}

                  {tournament.status === 'registration' && participantCount < tournament.minParticipants && (
                    <InfoBox $type="warning" style={{ marginTop: '1rem' }}>
                      Need {tournament.minParticipants - participantCount} more participants to generate bracket.
                    </InfoBox>
                  )}
                </CardBody>
              </Card>
            </>
          )}

          {activeTab === 'participants' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {game?.isTeamGame ? 'Teams' : 'Players'} ({registeredParticipants.length}/{tournament.maxParticipants})
                  </CardTitle>
                </CardHeader>
                <CardBody style={{ padding: 0 }}>
                  {game?.isTeamGame ? (
                    teams.length > 0 ? (
                      <ParticipantList>
                        {teams.map((team, index) => (
                          <TeamRowContainer key={team.id}>
                            <TeamHeader>
                              <ParticipantInfo>
                                <ParticipantRank>{index + 1}</ParticipantRank>
                                <ParticipantName>{team.name}</ParticipantName>
                              </ParticipantInfo>
                              <ParticipantBadge $status={team.isComplete ? 'registered' : 'forming'}>
                                {team.isComplete ? 'Ready' : 'Forming'}
                              </ParticipantBadge>
                            </TeamHeader>
                            {team.members && team.members.length > 0 && (
                              <TeamMembersList>
                                {team.members.map((member) => (
                                  <TeamMemberChip key={member.userId}>
                                    {member.user?.displayName || member.user?.username || `Player ${member.userId.slice(0, 6)}`}
                                  </TeamMemberChip>
                                ))}
                              </TeamMembersList>
                            )}
                          </TeamRowContainer>
                        ))}
                      </ParticipantList>
                    ) : (
                      <EmptyText>No teams registered</EmptyText>
                    )
                  ) : (
                    registeredParticipants.length > 0 ? (
                      <ParticipantList>
                        {registeredParticipants.map((p, index) => (
                          <ParticipantRow key={p.id}>
                            <ParticipantInfo>
                              <ParticipantRank>{index + 1}</ParticipantRank>
                              <ParticipantName>
                                {p.user?.displayName || p.user?.username || `Player ${p.userId?.slice(0, 6)}`}
                              </ParticipantName>
                            </ParticipantInfo>
                            <ParticipantBadge $status={p.status}>Entered</ParticipantBadge>
                          </ParticipantRow>
                        ))}
                      </ParticipantList>
                    ) : (
                      <EmptyText>No players registered</EmptyText>
                    )
                  )}
                </CardBody>

                {/* Team Pairing */}
                {game?.isTeamGame && unassignedPlayers.length > 0 && tournament.status === 'registration' && (
                  <TeamPairingSection style={{ padding: '1.25rem' }}>
                    <PairingTitle>Manual Team Pairing</PairingTitle>
                    <InfoBox>Select {game.playersPerTeam} players to form a team.</InfoBox>

                    <PairingRow>
                      <Input
                        type="text"
                        placeholder="Team name..."
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                      />
                      <ActionButton 
                        $variant="primary"
                        onClick={createTeam}
                        disabled={actionLoading || selectedPlayers.length !== game.playersPerTeam || !teamName.trim()}
                      >
                        Create Team
                      </ActionButton>
                    </PairingRow>

                    <ParticipantList>
                      {unassignedPlayers.map(p => (
                        <ParticipantRow 
                          key={p.id}
                          $selected={selectedPlayers.includes(p.userId || '')}
                          onClick={() => p.userId && togglePlayerSelection(p.userId)}
                        >
                          <ParticipantInfo>
                            <ParticipantName>
                              {p.user?.displayName || p.user?.username || `Player ${p.userId?.slice(0, 6)}`}
                            </ParticipantName>
                          </ParticipantInfo>
                          {selectedPlayers.includes(p.userId || '') && (
                            <ParticipantBadge $status="checked_in">Selected</ParticipantBadge>
                          )}
                        </ParticipantRow>
                      ))}
                    </ParticipantList>
                  </TeamPairingSection>
                )}
              </Card>

              {waitlist.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Waitlist ({waitlist.length})</CardTitle>
                  </CardHeader>
                  <CardBody style={{ padding: 0 }}>
                    <ParticipantList>
                      {waitlist.map((p, index) => (
                        <ParticipantRow key={p.id}>
                          <ParticipantInfo>
                            <ParticipantRank>{index + 1}</ParticipantRank>
                            <ParticipantName>
                              {p.user?.displayName || p.user?.username || `Player ${p.userId?.slice(0, 6)}`}
                            </ParticipantName>
                          </ParticipantInfo>
                          <ParticipantBadge $status="waitlist">Waitlist</ParticipantBadge>
                        </ParticipantRow>
                      ))}
                    </ParticipantList>
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {activeTab === 'actions' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Status Management</CardTitle>
                </CardHeader>
                <CardBody>
                  <InfoBox>
                    Current: <strong>{STATUS_LABELS[tournament.status]}</strong>
                  </InfoBox>

                  <ActionButtons>
                    {canOpenRegistration && (
                      <ActionButton $variant="primary" onClick={() => updateStatus('registration')} disabled={actionLoading}>
                        Open Registration
                      </ActionButton>
                    )}
                    {canGenerateBracket && (
                      <ActionButton $variant="primary" onClick={generateBracket} disabled={actionLoading}>
                        Generate Bracket
                      </ActionButton>
                    )}
                    {canStartTournament && (
                      <ActionButton $variant="success" onClick={() => updateStatus('in_progress')} disabled={actionLoading}>
                        Begin Tournament
                      </ActionButton>
                    )}
                    {canCompleteTournament && (
                      <ActionButton onClick={() => updateStatus('completed')} disabled={actionLoading}>
                        Complete Tournament
                      </ActionButton>
                    )}
                  </ActionButtons>
                </CardBody>
              </Card>

              {tournament.publishedEventId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Renaissance Events</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <InfoBox>
                      This tournament is published to Renaissance Events (ID: {tournament.publishedEventId}).
                      Events are automatically published when registration opens.
                    </InfoBox>
                    <ActionButtons>
                      <ActionButton 
                        onClick={publishToRenaissanceEvents} 
                        disabled={actionLoading}
                      >
                        Sync Changes to Renaissance Events
                      </ActionButton>
                    </ActionButtons>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                </CardHeader>
                <CardBody>
                  {!isLocked ? (
                    <>
                      <InfoBox $type="warning" style={{ marginBottom: '1rem' }}>
                        Cancelling cannot be undone.
                      </InfoBox>
                      <ActionButton 
                        $variant="danger" 
                        onClick={() => {
                          if (confirm('Cancel this tournament? This cannot be undone.')) {
                            updateStatus('cancelled');
                          }
                        }}
                        disabled={actionLoading}
                      >
                        Cancel Tournament
                      </ActionButton>
                    </>
                  ) : (
                    <InfoBox>This tournament is {tournament.status} and cannot be modified.</InfoBox>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </TabContent>
      </Main>
    </Container>
  );
}
