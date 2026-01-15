import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";
import { utcToEstDisplay } from "@/lib/timezone";

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
  entryFee: number | null;
  prizePool: number | null;
  location: string | null;
  startTime: string | null;
  participantCount: number;
  isRegistered?: boolean;
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

const DefaultAvatar = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
`;

const UserName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
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
  background: ${({ theme }) => theme.surface};
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

// Section Styles
const Section = styled.section`
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.4s ease-out;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SectionCount = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  background: ${({ theme }) => theme.surfaceHover};
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
`;

const SectionEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 1rem;
  text-align: center;
  background: ${({ theme }) => theme.surface};
  border-radius: 8px;
  border: 1px dashed ${({ theme }) => theme.border};
`;

// Tournament List
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
  grid-template-columns: 1fr auto;
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
  
  ${({ $status, theme }) => $status === 'registered' && `
    border-left: 2px solid rgb(34, 197, 94);
  `}
  
  ${({ $status, theme }) => $status === 'draft' && `
    border-left: 2px solid ${theme.textMuted};
  `}
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const TournamentMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const TournamentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GameType = styled.span<{ $isRegistered?: boolean }>`
  display: inline-block;
  width: fit-content;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${({ theme, $isRegistered }) => $isRegistered ? 'rgb(34, 197, 94)' : theme.accent};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.4rem;
  background: ${({ theme, $isRegistered }) => $isRegistered ? 'rgba(34, 197, 94, 0.15)' : theme.accentMuted};
  border-radius: 3px;
`;

const EntryPayout = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 600;
`;

const EntryFee = styled.span`
  color: ${({ theme }) => theme.textMuted};
`;

const PayoutAmount = styled.span`
  color: rgb(34, 197, 94);
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
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const TournamentStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  min-width: 80px;
`;

const RegistrationCount = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
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
      case 'registered':
        return `
          background: rgba(34, 197, 94, 0.15);
          color: rgb(34, 197, 94);
        `;
      case 'draft':
        return `
          background: ${theme.surfaceHover};
          color: ${theme.textMuted};
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Open',
  ready: 'Ready',
  in_progress: 'Live',
  completed: 'Done',
  cancelled: 'Void',
  registered: 'Registered',
};

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [imageError, setImageError] = useState(false);
  
  // Tournament state
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [openTournaments, setOpenTournaments] = useState<Tournament[]>([]);
  const [draftTournaments, setDraftTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        
        console.log('Dashboard response:', data);

        if (res.ok) {
          setLiveTournaments(data.liveTournaments || []);
          setOpenTournaments(data.openTournaments || []);
          setDraftTournaments(data.draftTournaments || []);
          setGames(data.games || []);
        } else {
          console.error('Dashboard API error:', data.error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getGame = (gameId: string) => games.find(g => g.id === gameId);

  const formatDate = (dateString: string | null) => {
    return utcToEstDisplay(dateString);
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(0)}`;
  };

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

  const renderTournamentRow = (tournament: Tournament, index: number) => {
    const game = getGame(tournament.gameId);
    // Show "registered" status if user is registered, otherwise show actual status
    const displayStatus = tournament.isRegistered ? 'registered' : tournament.status;
    
    return (
      <TournamentRow 
        key={tournament.id} 
        href={`/tournaments/${tournament.id}`}
        $status={displayStatus}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <TournamentMain>
          <TournamentHeader>
            <GameType $isRegistered={tournament.isRegistered}>
              {game?.name || 'Tournament'}
            </GameType>
            {((tournament.entryFee && tournament.entryFee > 0) || (tournament.prizePool && tournament.prizePool > 0)) && (
              <EntryPayout>
                {tournament.entryFee && tournament.entryFee > 0 ? (
                  <EntryFee>{formatCurrency(tournament.entryFee)}</EntryFee>
                ) : (
                  <EntryFee>Free</EntryFee>
                )}
                <span style={{ color: 'inherit', opacity: 0.5 }}>→</span>
                <PayoutAmount>
                  {tournament.prizePool && tournament.prizePool > 0 
                    ? formatCurrency(tournament.prizePool) 
                    : '$0'}
                </PayoutAmount>
              </EntryPayout>
            )}
          </TournamentHeader>
          <TournamentTitle>{tournament.name}</TournamentTitle>
          <TournamentMeta>
            {tournament.startTime && (
              <MetaItem>{formatDate(tournament.startTime)}</MetaItem>
            )}
            {tournament.startTime && tournament.location && (
              <MetaItem>•</MetaItem>
            )}
            {tournament.location && (
              <MetaItem>{tournament.location}</MetaItem>
            )}
          </TournamentMeta>
        </TournamentMain>

        <TournamentStatus>
          <StatusBadge $status={displayStatus}>
            {displayStatus === 'in_progress' && <LiveDot />}
            {STATUS_LABELS[displayStatus] || displayStatus}
          </StatusBadge>
          <RegistrationCount>
            {tournament.participantCount}/{tournament.maxParticipants}
          </RegistrationCount>
        </TournamentStatus>
      </TournamentRow>
    );
  };

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
          {isLoading ? (
            <LoadingArea>
              <LoadingSpinner />
              <LoadingText>Loading tournaments...</LoadingText>
            </LoadingArea>
          ) : (
            <>
              {/* Live Tournaments Section */}
              <Section>
                <SectionHeader>
                  <SectionTitle>
                    <LiveDot />
                    Live
                  </SectionTitle>
                  <SectionCount>{liveTournaments.length}</SectionCount>
                </SectionHeader>
                {liveTournaments.length === 0 ? (
                  <SectionEmpty>No live tournaments right now</SectionEmpty>
                ) : (
                  <TournamentGrid>
                    {liveTournaments.map((tournament, index) => renderTournamentRow(tournament, index))}
                  </TournamentGrid>
                )}
              </Section>

              {/* Open Tournaments Section */}
              <Section>
                <SectionHeader>
                  <SectionTitle>Open for Registration</SectionTitle>
                  <SectionCount>{openTournaments.length}</SectionCount>
                </SectionHeader>
                {openTournaments.length === 0 ? (
                  <SectionEmpty>No open tournaments available</SectionEmpty>
                ) : (
                  <TournamentGrid>
                    {openTournaments.map((tournament, index) => renderTournamentRow(tournament, index))}
                  </TournamentGrid>
                )}
              </Section>

              {/* Draft Tournaments Section - Only for admins/organizers */}
              {canCreateTournament && draftTournaments.length > 0 && (
                <Section>
                  <SectionHeader>
                    <SectionTitle>Draft</SectionTitle>
                    <SectionCount>{draftTournaments.length}</SectionCount>
                  </SectionHeader>
                  <TournamentGrid>
                    {draftTournaments.map((tournament, index) => renderTournamentRow(tournament, index))}
                  </TournamentGrid>
                </Section>
              )}
            </>
          )}
        </ContentArea>
      </Main>
    </Container>
  );
};

export default DashboardPage;
