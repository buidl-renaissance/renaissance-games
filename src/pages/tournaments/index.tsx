import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
  flex-wrap: wrap;
  gap: 1rem;
`;

const Logo = styled(Link)`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NavLink = styled(Link)`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const CreateButton = styled(Link)`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const PageSubtitle = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.textSecondary};
  font-style: italic;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding-bottom: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
`;

const Tab = styled.button<{ $active: boolean }>`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px 8px 0 0;
  color: ${({ theme, $active }) => $active ? theme.accent : theme.textSecondary};
  background: ${({ theme, $active }) => $active ? theme.backgroundAlt : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.backgroundAlt};
  }
`;

const TournamentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.3s both;
`;

const TournamentCard = styled(Link)`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px ${({ theme }) => theme.shadow};
    border-color: ${({ theme }) => theme.accentGold};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  flex-shrink: 0;
  
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

const GameBadge = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardDescription = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  line-height: 1.5;
  flex: 1;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const MetaItem = styled.div`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const MetaIcon = styled.span`
  font-size: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  animation: ${fadeIn} 0.5s ease-out 0.3s both;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 1.5rem;
`;

const GAME_ICONS: Record<string, string> = {
  euchre: '🃏',
  pool: '🎱',
  chess: '♟️',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Open',
  ready: 'Ready',
  in_progress: 'Live',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

export default function TournamentsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tournamentsRes, gamesRes] = await Promise.all([
        fetch(`/api/tournaments?status=${activeTab}`),
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

  const getGame = (gameId: string) => games.find(g => g.id === gameId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(0)}`;
  };

  if (isUserLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <Container>
      <Head>
        <title>Tournaments | Renaissance City Games</title>
        <meta name="description" content="Browse and join tournaments" />
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <Nav>
          <NavLink href="/dashboard">Dashboard</NavLink>
          {user && (user.role === 'admin' || user.role === 'organizer') && (
            <CreateButton href="/tournaments/create">Create Tournament</CreateButton>
          )}
        </Nav>
      </Header>

      <Main>
        <PageTitle>Tournaments</PageTitle>
        <PageSubtitle>Compete, conquer, and claim your glory</PageSubtitle>

        <Tabs>
          <Tab $active={activeTab === 'active'} onClick={() => setActiveTab('active')}>
            Active Tournaments
          </Tab>
          <Tab $active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
            All Tournaments
          </Tab>
        </Tabs>

        {isLoading ? (
          <Loading text="Loading tournaments..." />
        ) : tournaments.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No tournaments found</EmptyTitle>
            <EmptyText>
              {activeTab === 'active'
                ? 'There are no active tournaments at the moment. Check back soon!'
                : 'No tournaments have been created yet.'}
            </EmptyText>
            {user && (user.role === 'admin' || user.role === 'organizer') && (
              <CreateButton href="/tournaments/create">Create Tournament</CreateButton>
            )}
          </EmptyState>
        ) : (
          <TournamentsGrid>
            {tournaments.map(tournament => {
              const game = getGame(tournament.gameId);
              return (
                <TournamentCard key={tournament.id} href={`/tournaments/${tournament.id}`}>
                  <CardHeader>
                    <div>
                      <CardTitle>{tournament.name}</CardTitle>
                      <GameBadge>
                        <span>{game ? GAME_ICONS[game.type] || '🎮' : '🎮'}</span>
                        {game?.name || 'Game'}
                        {game?.isTeamGame && ' (Teams)'}
                      </GameBadge>
                    </div>
                    <StatusBadge $status={tournament.status}>
                      {STATUS_LABELS[tournament.status] || tournament.status}
                    </StatusBadge>
                  </CardHeader>

                  {tournament.description && (
                    <CardDescription>
                      {tournament.description.length > 100
                        ? `${tournament.description.slice(0, 100)}...`
                        : tournament.description}
                    </CardDescription>
                  )}

                  <CardMeta>
                    <MetaItem>
                      <MetaIcon>👥</MetaIcon>
                      {tournament.minParticipants}-{tournament.maxParticipants} players
                    </MetaItem>
                    {tournament.location && (
                      <MetaItem>
                        <MetaIcon>📍</MetaIcon>
                        {tournament.location}
                      </MetaItem>
                    )}
                    {tournament.startTime && (
                      <MetaItem>
                        <MetaIcon>📅</MetaIcon>
                        {formatDate(tournament.startTime)}
                      </MetaItem>
                    )}
                    {tournament.prizePool && tournament.prizePool > 0 && (
                      <MetaItem>
                        <MetaIcon>🏆</MetaIcon>
                        {formatCurrency(tournament.prizePool)} prize
                      </MetaItem>
                    )}
                  </CardMeta>
                </TournamentCard>
              );
            })}
          </TournamentsGrid>
        )}
      </Main>
    </Container>
  );
}
