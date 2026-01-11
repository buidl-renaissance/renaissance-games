import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";

// App configuration
const APP_NAME = "Into the Void";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px ${({ theme }) => theme.accentGlow};
  }
  50% {
    box-shadow: 0 0 40px ${({ theme }) => theme.accentGlow};
  }
`;

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
  flex-wrap: wrap;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ProfileImageContainer = styled.div`
  width: 40px;
  height: 40px;
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
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
`;

const WelcomeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const Greeting = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.text};
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const SubGreeting = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const BrandMark = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
`;

const BrandName = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SettingsButton = styled(Link)`
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

const HeaderSpacer = styled.div`
  height: 64px; /* Match header height */
`;

const ContentSection = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const VoidSymbol = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  animation: ${pulseGlow} 3s ease-in-out infinite;
  
  &::before {
    content: '';
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${({ theme }) => theme.accent};
    opacity: 0.3;
  }
`;

const PlaceholderTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.35rem;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: block;
`;

const PlaceholderText = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textMuted};
  max-width: 420px;
  line-height: 1.7;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 16px ${({ theme }) => theme.accentGlow};
    color: white;
  }
`;

const SecondaryAction = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    border-color: ${({ theme }) => theme.textMuted};
    color: ${({ theme }) => theme.text};
  }
`;

const Divider = styled.div`
  width: 32px;
  height: 1px;
  background: ${({ theme }) => theme.border};
  margin: 1rem 0;
`;

const GameIcons = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  opacity: 0.4;
`;

const GameIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const IconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`;

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [imageError, setImageError] = React.useState(false);

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
        
        if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
          await sdk.actions.ready();
        }
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };

    callReady();
  }, []);

  // Only show loading if we're checking and have NO cached user
  // If we have a cached user, show dashboard immediately
  if (isUserLoading && !user) {
    return <Loading text="Entering..." />;
  }

  // Redirect if no user after loading complete
  if (!isUserLoading && !user) {
    return null;
  }

  // If user is null but still loading, don't render
  if (!user) {
    return null;
  }

  const displayName = user.username || user.displayName || `User ${user.fid}`;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
            <WelcomeText>
              <Greeting>{displayName}</Greeting>
              <SubGreeting>Ready to compete</SubGreeting>
            </WelcomeText>
          </UserSection>
          <HeaderRight>
            {user.role === 'admin' && (
              <SettingsButton href="/admin/users" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </SettingsButton>
            )}
          </HeaderRight>
        </DashboardHeader>

        <HeaderSpacer />
        <ContentSection>
          <VoidSymbol />
          <PlaceholderTitle>Competitive Rituals</PlaceholderTitle>
          <Subtitle>Await</Subtitle>
          <Divider />
          <PlaceholderText>
            Step into focused competition. Join tournaments, 
            advance through brackets, claim your place.
          </PlaceholderText>
          <QuickActions>
            <ActionButton href="/tournaments">
              Enter Tournaments
            </ActionButton>
            {user && (user.role === 'admin' || user.role === 'organizer') && (
              <SecondaryAction href="/tournaments/create">
                Create Tournament
              </SecondaryAction>
            )}
            {user && user.role === 'admin' && (
              <SecondaryAction href="/admin/users">
                Manage Users
              </SecondaryAction>
            )}
          </QuickActions>
          
          <GameIcons>
            <GameIcon>
              <IconCircle>♟</IconCircle>
              Chess
            </GameIcon>
            <GameIcon>
              <IconCircle>🎱</IconCircle>
              Pool
            </GameIcon>
            <GameIcon>
              <IconCircle>🃏</IconCircle>
              Euchre
            </GameIcon>
          </GameIcons>
        </ContentSection>
      </Main>
    </Container>
  );
};

export default DashboardPage;
