import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

interface Game {
  id: string;
  type: string;
  name: string;
  description: string;
  isTeamGame: boolean;
  minPlayers: number;
  maxPlayers: number;
}

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
  location: string | null;
  startTime: string | null;
  registrationDeadline: string | null;
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const subtleGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(123, 92, 255, 0.15); }
  50% { box-shadow: 0 0 30px rgba(123, 92, 255, 0.25); }
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

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  transition: color 0.15s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const CreateButton = styled(Link)`
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

const Main = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
`;

// Hero
const Hero = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const HeroTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
  letter-spacing: -0.03em;
`;

const HeroSubtitle = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  max-width: 400px;
  margin: 0 auto;
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
  animation: ${fadeIn} 0.4s ease-out 0.1s both;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
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

const SearchInput = styled.input`
  padding: 0.5rem 0.875rem;
  font-size: 0.85rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.text};
  width: 180px;
  transition: all 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
`;

const ResultCount = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
`;

// Tournament Grid
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
  gap: 2rem;
  padding: 1.25rem 1.5rem;
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
`;

const TournamentMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const TournamentTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const TournamentMeta = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const MetaItem = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const GameLabel = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TournamentStats = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const Stat = styled.div`
  text-align: right;
`;

const StatValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TournamentStatus = styled.div`
  min-width: 100px;
  text-align: right;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
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

// Featured Tournament (accent)
const FeaturedTournament = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.accent};
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  animation: ${subtleGlow} 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
`;

const FeaturedLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
`;

const FeaturedTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const FeaturedMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const EnterButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
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
  padding: 4rem 2rem;
  color: ${({ theme }) => theme.textSecondary};
  animation: ${fadeIn} 0.4s ease-out;
`;

const EmptyTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1.5rem;
`;

// Game-specific naming
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
  draft: 'Pending',
  registration: 'Enter',
  ready: 'Begin',
  in_progress: 'Live',
  completed: 'Finished',
  cancelled: 'Void',
};

type StatusFilter = 'all' | 'active' | 'registration' | 'in_progress' | 'completed';

export default function TournamentsPage() {
  const { user } = useUser();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [gameFilter, setGameFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchData();
  }, [statusFilter]);

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

  // Filter and sort tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    if (gameFilter) {
      const game = getGame(tournament.gameId);
      if (game?.type !== gameFilter) return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = tournament.name.toLowerCase().includes(query);
      const matchesLocation = tournament.location?.toLowerCase().includes(query);
      if (!matchesName && !matchesLocation) return false;
    }
    
    return true;
  });

  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
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

  // Get featured tournament (first live or open)
  const featuredTournament = sortedTournaments.find(
    t => t.status === 'in_progress' || t.status === 'registration'
  );
  const remainingTournaments = featuredTournament 
    ? sortedTournaments.filter(t => t.id !== featuredTournament.id)
    : sortedTournaments;

  // Show loading only during initial data fetch
  if (isLoading && tournaments.length === 0) {
    return <Loading text="Loading tournaments..." />;
  }

  return (
    <Container>
      <Head>
        <title>Tournaments | Renaissance City</title>
        <meta name="description" content="Enter the void. Compete in tournaments." />
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <Nav>
          <NavLink href="/dashboard">Dashboard</NavLink>
          {user && (user.role === 'admin' || user.role === 'organizer') && (
            <CreateButton href="/tournaments/create">New Tournament</CreateButton>
          )}
        </Nav>
      </Header>

      <Main>
        <Hero>
          <HeroTitle>Into the Void</HeroTitle>
          <HeroSubtitle>
            Step out of the everyday. Enter focused competition.
          </HeroSubtitle>
        </Hero>

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
            <FilterButton 
              $active={statusFilter === 'all'} 
              onClick={() => setStatusFilter('all')}
            >
              All
            </FilterButton>
          </FilterGroup>

          <FilterGroup>
            <SearchInput
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ResultCount>
              {sortedTournaments.length} {sortedTournaments.length === 1 ? 'tournament' : 'tournaments'}
            </ResultCount>
          </FilterGroup>
        </FilterBar>

        {isLoading ? (
          <Loading text="Loading..." />
        ) : sortedTournaments.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No tournaments found</EmptyTitle>
            <EmptyText>
              {searchQuery || gameFilter
                ? 'Adjust filters to find tournaments.'
                : 'No active tournaments. Check back soon.'}
            </EmptyText>
            {user && (user.role === 'admin' || user.role === 'organizer') && (
              <CreateButton href="/tournaments/create">Create Tournament</CreateButton>
            )}
          </EmptyState>
        ) : (
          <>
            {/* Featured Tournament - only one accent on screen */}
            {featuredTournament && (
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

            {/* Tournament List */}
            {remainingTournaments.length > 0 && (
              <TournamentGrid>
                {remainingTournaments.map((tournament, index) => {
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
      </Main>
    </Container>
  );
}
