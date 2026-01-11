import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { Loading } from "@/components/Loading";

// App configuration
const APP_NAME = "Renaissance City";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
  
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
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.accentGold};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.accent} 0%,
    ${({ theme }) => theme.accentGold} 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Cormorant Garamond', Georgia, serif;
`;

const WelcomeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const Greeting = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.text};
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const SubGreeting = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  font-style: italic;
`;

const BrandMark = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
`;

const BrandName = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  letter-spacing: 0.05em;
  
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
  padding: 3rem 2rem;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const PlaceholderTitle = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PlaceholderText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.textSecondary};
  max-width: 520px;
  line-height: 1.7;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled(Link)`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
    color: white;
  }
`;

const SecondaryAction = styled(Link)`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  background: transparent;
  color: ${({ theme }) => theme.text};
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const Divider = styled.div`
  width: 60px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    ${({ theme }) => theme.accentGold},
    transparent
  );
  margin: 1.5rem 0;
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
    return <Loading text="Loading..." />;
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
        <meta name="description" content={`Your ${APP_NAME} dashboard`} />
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
              <Greeting>Welcome, {displayName}</Greeting>
              <SubGreeting>What are we building today?</SubGreeting>
            </WelcomeText>
          </UserSection>
          <BrandMark>
            <BrandName>Renaissance City</BrandName>
          </BrandMark>
        </DashboardHeader>

        <ContentSection>
          <PlaceholderTitle>Renaissance City Games</PlaceholderTitle>
          <Divider />
          <PlaceholderText>
            Compete in tournaments, climb the ranks, and claim your glory. 
            Join the Renaissance — where every game is a chance to make history.
          </PlaceholderText>
          <QuickActions>
            <ActionButton href="/tournaments">
              🏆 Browse Tournaments
            </ActionButton>
            {user && (user.role === 'admin' || user.role === 'organizer') && (
              <SecondaryAction href="/tournaments/create">
                Create Tournament
              </SecondaryAction>
            )}
            {user && user.role === 'admin' && (
              <SecondaryAction href="/admin/users">
                ⚙️ Manage Users
              </SecondaryAction>
            )}
          </QuickActions>
        </ContentSection>
      </Main>
    </Container>
  );
};

export default DashboardPage;
