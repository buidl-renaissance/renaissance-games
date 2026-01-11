import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/router';
import { User } from '@/db/user';

interface SplashProps {
  user?: User | null;
  isLoading?: boolean;
  redirectDelay?: number;
  appName?: string;
  onCreateAccount?: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const progressAnimation = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
`;

// Fixed layout container - prevents shifting
const SplashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.background};
  z-index: 9999;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: 320px;
  padding: 0 1.5rem;
`;

const LogoSection = styled.div`
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Logo = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  margin: 0;
  color: ${({ theme }) => theme.text};
  letter-spacing: -0.02em;
`;

const LogoAccent = styled.span`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.5rem;
`;

// Fixed height container for the profile area - prevents layout shift
const ProfileArea = styled.div`
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
`;

const ProfileContent = styled.div<{ $visible: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const AvatarContainer = styled.div`
  width: 80px;
  height: 80px;
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
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
`;

const VoidSymbol = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: ${rotate} 8s linear infinite;
  flex-shrink: 0;
  
  &::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1px dashed ${({ theme }) => theme.border};
    animation: ${rotate} 4s linear infinite reverse;
  }
`;

const VoidCore = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  animation: ${pulseGlow} 2s ease-in-out infinite;
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
`;

const WelcomeText = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const SubText = styled.p<{ $animate?: boolean }>`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  animation: ${({ $animate }) => $animate ? pulse : 'none'} 2s ease-in-out infinite;
`;

// Fixed height for progress area
const ProgressArea = styled.div`
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const ProgressContainer = styled.div<{ $visible: boolean }>`
  width: 140px;
  height: 2px;
  background: ${({ theme }) => theme.border};
  border-radius: 1px;
  overflow: hidden;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ProgressBar = styled.div<{ duration: number }>`
  height: 100%;
  background: ${({ theme }) => theme.accent};
  border-radius: 1px;
  animation: ${progressAnimation} ${({ duration }) => duration}ms linear forwards;
`;

const Splash: React.FC<SplashProps> = ({ 
  user, 
  isLoading = false, 
  redirectDelay = 1000,
  appName = 'Into the Void',
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Start redirect timer when we have a user
  useEffect(() => {
    if (user && !isLoading) {
      setShouldRedirect(true);
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [router, redirectDelay, user, isLoading]);

  const displayName = user?.username || user?.displayName || (user?.fid ? `User ${user.fid}` : '');
  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  const isAuthenticated = !!user && !isLoading;
  const isVerifying = isLoading || (!user && isLoading);

  return (
    <SplashContainer>
      <ContentWrapper>
        <LogoSection>
          <Logo>{appName}</Logo>
          <LogoAccent>Competitive Rituals</LogoAccent>
        </LogoSection>
        
        <ProfileArea>
          {/* Loading state - void symbol */}
          {!isAuthenticated && (
            <ProfileContent $visible={!isAuthenticated}>
              <VoidSymbol>
                <VoidCore />
              </VoidSymbol>
              <TextGroup>
                <WelcomeText>Welcome</WelcomeText>
                <SubText $animate>Verifying...</SubText>
              </TextGroup>
            </ProfileContent>
          )}
          
          {/* Authenticated state - user profile */}
          {isAuthenticated && (
            <ProfileContent $visible={isAuthenticated}>
              <AvatarContainer>
                {user?.pfpUrl && !imageError ? (
                  <ProfileImage
                    src={user.pfpUrl}
                    alt={displayName}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <DefaultAvatar>{initials || '?'}</DefaultAvatar>
                )}
              </AvatarContainer>
              <TextGroup>
                <WelcomeText>{displayName}</WelcomeText>
                <SubText $animate>Entering...</SubText>
              </TextGroup>
            </ProfileContent>
          )}
        </ProfileArea>

        <ProgressArea>
          <ProgressContainer $visible={shouldRedirect}>
            <ProgressBar duration={redirectDelay} />
          </ProgressContainer>
        </ProgressArea>
      </ContentWrapper>
    </SplashContainer>
  );
};

export default Splash;
