import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";

// App configuration
const APP_NAME = "Into the Void";

interface Game {
  id: string;
  type: string;
  name: string;
}

interface Tournament {
  id: string;
  gameId: string;
  name: string;
  status: string;
  minParticipants: number;
  maxParticipants: number;
  prizePool: number | null;
  location: string | null;
  startTime: string | null;
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const livePulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const subtleGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(123, 92, 255, 0.15); }
  50% { box-shadow: 0 0 30px rgba(123, 92, 255, 0.25); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Layout
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// Header
const DashboardHeader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProfileImageContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
`;

const UserName = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IconButton = styled(Link)`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.textMuted};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  transition: all 0.15s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.backgroundAlt};
    border-color: ${({ theme }) => theme.textMuted};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const CreateButton = styled(Link)`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${({ theme }) => theme.accent};
  border: none;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    transform: scale(1.05);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const HeaderSpacer = styled.div`
  height: 60px;
`;

// Content
const ContentArea = styled.div`
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 1rem;
`;

// Filters
const FilterBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  font-size: 0.85rem;
  padding: 0.5rem 0.875rem;
  border-radius: 4px;
  transition: all 0.15s ease;
  
  ${({ theme, $active }) => $active ? `
    background: ${theme.accent};
    color: white;
  ` : `
    background: transparent;
    color: ${theme.textMuted};
    
    &:hover {
      color: ${theme.text};
      background: ${theme.surfaceHover};
    }
  `}
`;

const ResultCount = styled.span<{ $loading?: boolean }>`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  opacity: ${({ $loading }) => $loading ? 0.6 : 1};
  transition: opacity 0.15s ease;
`;

// Tournament List
const TournamentContent = styled.div<{ $loading?: boolean }>`
  opacity: ${({ $loading }) => $loading ? 0.5 : 1};
  transition: opacity 0.15s ease;
  pointer-events: ${({ $loading }) => $loading ? 'none' : 'auto'};
`;

const TournamentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: ${({ theme }) => theme.border};
  border-radius: 8px;
  overflow: hidden;
`;

const TournamentRow = styled(Link)<{ $status: string }>`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.surface};
  transition: all 0.15s ease;
  animation: ${fadeIn} 0.4s ease-out;
  align-items: center;
  
  ${({ $status, theme }) => $status === 'in_progress' && `
    border-left: 2px solid ${theme.live};
  `}
  
  ${({ $status, theme }) => $status === 'registration' && `
    border-left: 2px solid ${theme.accent};
  `}
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
  }
`;

const TournamentMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const GameLabel = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TournamentTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TournamentMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const MetaItem = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const TournamentStats = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  
  @media (max-width: 600px) {
    display: none;
  }
`;

const Stat = styled.div`
  text-align: right;
`;

const StatValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const StatLabel = styled.div`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TournamentStatus = styled.div`
  min-width: 80px;
  text-align: right;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.3rem 0.6rem;
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
  width: 5px;
  height: 5px;
  background: ${({ theme }) => theme.live};
  border-radius: 50%;
  margin-right: 0.4rem;
  animation: ${livePulse} 1.5s ease-in-out infinite;
`;

// Featured Tournament
const FeaturedTournament = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  animation: ${subtleGlow} 3s ease-in-out infinite;
`;

const FeaturedLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
`;

const FeaturedTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const FeaturedMeta = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const EnterButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.6rem 1.25rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border-radius: 6px;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-1px);
  }
`;

// Empty State
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1.5rem;
  color: ${({ theme }) => theme.textSecondary};
  animation: ${fadeIn} 0.4s ease-out;
`;

const EmptyTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1.5rem;
`;

// Inline Loading
const LoadingArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 2px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
`;

// Game naming
const GAME_NAMES: Record<string, string> = {
  euchre: 'Deal Into the Void',
  pool: 'Break Into the Void',
  chess: 'Endgame: Into the Void',
};

const GAME_ICONS: Record<string, string> = {
  euchre: '🃏',
  pool: '🎱',
  chess: '♟',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Open',
  ready: 'Ready',
  in_progress: 'Live',
  completed: 'Done',
  cancelled: 'Void',
};

type StatusFilter = 'active' | 'registration' | 'in_progress' | 'draft';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [imageError, setImageError] = useState(false);
  
  // Tournament state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [isUserLoading, user, router]);

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    const callReady = async () => {
      if (typeof window === 'undefined') return;
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        if (sdk?.actions?.ready) {
          await sdk.actions.ready();
        }
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };
    callReady();
  }, []);

  // Fetch tournaments
  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialLoad) {
        setIsFiltering(true);
      }
      
      try {
        const [tournamentsRes, gamesRes] = await Promise.all([
          fetch(`/api/tournaments?status=${statusFilter}`),
          fetch('/api/games'),
        ]);

        if (tournamentsRes.ok) {
          const data = await tournamentsRes.json();
          setTournaments(data.tournaments || []);
        }

        if (gamesRes.ok) {
          const data = await gamesRes.json();
          setGames(data.games || []);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setIsInitialLoad(false);
        setIsFiltering(false);
      }
    };

    if (user) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user]);

  const getGame = (gameId: string) => games.find(g => g.id === gameId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(0)}`;
  };

  // Sort tournaments
  const sortedTournaments = [...tournaments].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      in_progress: 0,
      registration: 1,
      ready: 2,
      completed: 3,
      cancelled: 4,
      draft: 5,
    };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  // Get featured tournament
  const featuredTournament = sortedTournaments.find(
    t => t.status === 'in_progress' || t.status === 'registration'
  );
  const remainingTournaments = featuredTournament 
    ? sortedTournaments.filter(t => t.id !== featuredTournament.id)
    : sortedTournaments;

  const canCreateTournament = user && (user.role === 'admin' || user.role === 'organizer');

  // Loading state
  if (isUserLoading && !user) {
    return <Loading text="Entering..." />;
  }

  if (!isUserLoading && !user) {
    return null;
  }

  if (!user) {
    return null;
  }

  const displayName = user.username || user.displayName || `User ${user.fid}`;
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Container>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content="Enter the void. Compete in tournaments." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Main>
        <DashboardHeader>
          <UserSection>
            <ProfileImageContainer>
              {user.pfpUrl && !imageError ? (
                <ProfileImage
                  src={user.pfpUrl}
                  alt={displayName}
                  onError={() => setImageError(true)}
                />
              ) : (
                <DefaultAvatar>{initials}</DefaultAvatar>
              )}
            </ProfileImageContainer>
            <UserName>{displayName}</UserName>
          </UserSection>
          <HeaderRight>
            {canCreateTournament && (
              <CreateButton href="/tournaments/create" title="Create Tournament">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </CreateButton>
            )}
            {user.role === 'admin' && (
              <IconButton href="/admin/users" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </IconButton>
            )}
          </HeaderRight>
        </DashboardHeader>

        <HeaderSpacer />
        
        <ContentArea>
          <FilterBar>
            <FilterGroup>
              <FilterButton 
                $active={statusFilter === 'active'} 
                onClick={() => setStatusFilter('active')}
              >
                Active
              </FilterButton>
              <FilterButton 
                $active={statusFilter === 'registration'} 
                onClick={() => setStatusFilter('registration')}
              >
                Open
              </FilterButton>
              <FilterButton 
                $active={statusFilter === 'in_progress'} 
                onClick={() => setStatusFilter('in_progress')}
              >
                Live
              </FilterButton>
              {canCreateTournament && (
                <FilterButton 
                  $active={statusFilter === 'draft'} 
                  onClick={() => setStatusFilter('draft')}
                >
                  Drafts
                </FilterButton>
              )}
            </FilterGroup>
            <ResultCount $loading={isFiltering}>
              {isFiltering ? 'Loading...' : `${sortedTournaments.length} ${sortedTournaments.length === 1 ? 'tournament' : 'tournaments'}`}
            </ResultCount>
          </FilterBar>

          {isInitialLoad || isFiltering ? (
            <LoadingArea>
              <LoadingSpinner />
              <LoadingText>{isInitialLoad ? 'Loading tournaments...' : 'Loading...'}</LoadingText>
            </LoadingArea>
          ) : (
            <TournamentContent $loading={false}>
              {sortedTournaments.length === 0 ? (
                <EmptyState>
                  <EmptyTitle>No tournaments found</EmptyTitle>
                  <EmptyText>
                    {statusFilter === 'draft' 
                      ? 'No draft tournaments. Create one to get started.'
                      : 'No tournaments available. Check back soon.'}
                  </EmptyText>
                  {canCreateTournament && (
                    <EnterButton href="/tournaments/create">Create Tournament</EnterButton>
                  )}
                </EmptyState>
              ) : (
                <>
                  {featuredTournament && statusFilter === 'active' && (
                    <FeaturedTournament>
                      <FeaturedLabel>
                        {featuredTournament.status === 'in_progress' ? (
                          <><LiveDot />Live Now</>
                        ) : (
                          'Open for Entry'
                        )}
                      </FeaturedLabel>
                      <FeaturedTitle>{featuredTournament.name}</FeaturedTitle>
                      <FeaturedMeta>
                        <MetaItem>
                          {GAME_ICONS[getGame(featuredTournament.gameId)?.type || ''] || '🎮'}{' '}
                          {GAME_NAMES[getGame(featuredTournament.gameId)?.type || ''] || getGame(featuredTournament.gameId)?.name || 'Tournament'}
                        </MetaItem>
                        {featuredTournament.location && (
                          <MetaItem>📍 {featuredTournament.location}</MetaItem>
                        )}
                        {featuredTournament.startTime && (
                          <MetaItem>{formatDate(featuredTournament.startTime)}</MetaItem>
                        )}
                      </FeaturedMeta>
                      <EnterButton href={`/tournaments/${featuredTournament.id}`}>
                        {featuredTournament.status === 'in_progress' ? 'View Bracket' : 'Enter'} →
                      </EnterButton>
                    </FeaturedTournament>
                  )}

                  {(statusFilter === 'active' ? remainingTournaments : sortedTournaments).length > 0 && (
                    <TournamentGrid>
                      {(statusFilter === 'active' ? remainingTournaments : sortedTournaments).map((tournament, index) => {
                        const game = getGame(tournament.gameId);
                        
                        return (
                          <TournamentRow 
                            key={tournament.id} 
                            href={`/tournaments/${tournament.id}`}
                            $status={tournament.status}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <TournamentMain>
                              <GameLabel>
                                {GAME_ICONS[game?.type || ''] || '🎮'}{' '}
                                {GAME_NAMES[game?.type || ''] || game?.name || 'Tournament'}
                              </GameLabel>
                              <TournamentTitle>{tournament.name}</TournamentTitle>
                              <TournamentMeta>
                                {tournament.location && (
                                  <MetaItem>{tournament.location}</MetaItem>
                                )}
                                {tournament.startTime && (
                                  <MetaItem>{formatDate(tournament.startTime)}</MetaItem>
                                )}
                              </TournamentMeta>
                            </TournamentMain>

                            <TournamentStats>
                              <Stat>
                                <StatValue>
                                  {tournament.minParticipants}–{tournament.maxParticipants}
                                </StatValue>
                                <StatLabel>Players</StatLabel>
                              </Stat>
                              {tournament.prizePool && tournament.prizePool > 0 && (
                                <Stat>
                                  <StatValue>{formatCurrency(tournament.prizePool)}</StatValue>
                                  <StatLabel>Prize</StatLabel>
                                </Stat>
                              )}
                            </TournamentStats>

                            <TournamentStatus>
                              <StatusBadge $status={tournament.status}>
                                {tournament.status === 'in_progress' && <LiveDot />}
                                {STATUS_LABELS[tournament.status] || tournament.status}
                              </StatusBadge>
                            </TournamentStatus>
                          </TournamentRow>
                        );
                      })}
                    </TournamentGrid>
                  )}
                </>
              )}
            </TournamentContent>
          )}
        </ContentArea>
      </Main>
    </Container>
  );
};

export default DashboardPage;
