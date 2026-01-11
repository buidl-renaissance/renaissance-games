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
  width: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ProfileImageContainer = styled.div`
  width: 48px;
  height: 48px;
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
  background: ${({ theme }) => theme.steelGray};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.signalWhite};
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
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const ContentSection = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const VoidSymbol = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  animation: ${pulseGlow} 3s ease-in-out infinite;
  
  &::before {
    content: '';
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${({ theme }) => theme.accent};
    opacity: 0.3;
  }
`;

const PlaceholderTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
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
  gap: 1rem;
  margin-top: 3rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.signalWhite};
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ theme }) => theme.accentGlow};
    color: ${({ theme }) => theme.signalWhite};
  }
`;

const SecondaryAction = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 1rem 2rem;
  background: transparent;
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    border-color: ${({ theme }) => theme.steelGray};
    color: ${({ theme }) => theme.text};
  }
`;

const Divider = styled.div`
  width: 40px;
  height: 1px;
  background: ${({ theme }) => theme.border};
  margin: 1.5rem 0;
`;

const GameIcons = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 4rem;
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
  width: 48px;
  height: 48px;
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

  // Show loading while checking auth
  if (isUserLoading) {
    return <Loading text="Entering..." />;
  }

  // Don't render anything while redirecting
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
        <title>Dashboard | {APP_NAME}</title>
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
          <BrandMark>
            <BrandName>Into the Void</BrandName>
          </BrandMark>
        </DashboardHeader>

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
