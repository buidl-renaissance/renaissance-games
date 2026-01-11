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
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const progressAnimation = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
`;

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
  gap: 2.5rem;
  overflow: hidden;
`;

const LogoContainer = styled.div`
  animation: ${scaleIn} 0.6s ease-out;
  text-align: center;
`;

const Logo = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  margin: 0;
  text-align: center;
  color: ${({ theme }) => theme.text};
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const LogoAccent = styled.span`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.5rem;
`;

const AccentBar = styled.div`
  width: 40px;
  height: 2px;
  background: ${({ theme }) => theme.accent};
  margin: 1rem auto 0;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  animation: ${fadeIn} 0.6s ease-out 0.2s both;
`;

const ProfileImageContainer = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
  font-size: 2rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
`;

const VoidSymbol = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: ${rotate} 8s linear infinite;
  
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  animation: ${pulseGlow} 2s ease-in-out infinite;
`;

const WelcomeText = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  text-align: center;
`;

const SubText = styled.p<{ $animate?: boolean }>`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
  animation: ${({ $animate }) => $animate ? pulse : 'none'} 2s ease-in-out infinite;
`;

const CreateAccountButton = styled.button`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${fadeIn} 0.6s ease-out;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ theme }) => theme.accentGlow};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NoAccountSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
  text-align: center;
  max-width: 320px;
`;

const NoAccountText = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  line-height: 1.6;
  margin: 0;
`;

const ProgressContainer = styled.div`
  width: 160px;
  height: 2px;
  background: ${({ theme }) => theme.border};
  border-radius: 1px;
  overflow: hidden;
  animation: ${fadeIn} 0.6s ease-out 0.5s both;
`;

const ProgressBar = styled.div<{ duration: number }>`
  height: 100%;
  background: ${({ theme }) => theme.accent};
  border-radius: 1px;
  animation: 
    ${progressAnimation} ${({ duration }) => duration}ms linear forwards,
    ${shimmer} 2s linear infinite;
  background-size: 200% 100%;
`;

const Splash: React.FC<SplashProps> = ({ 
  user, 
  isLoading = false, 
  redirectDelay = 1200,  // Faster redirect
  appName = 'Into the Void',
  onCreateAccount
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Only start redirect timer when we have a user (authenticated)
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
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  // Show create account when not loading and no user
  const showCreateAccount = !isLoading && !user;

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      // Default behavior: open Renaissance signup
      window.open('https://renaissance.city/signup', '_blank');
    }
  };

  return (
    <SplashContainer>
      <LogoContainer>
        <Logo>{appName}</Logo>
        <LogoAccent>Competitive Rituals</LogoAccent>
        <AccentBar />
      </LogoContainer>
      
      <ProfileSection>
        {user ? (
          <>
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
            <WelcomeText>Welcome, {displayName}</WelcomeText>
            <SubText $animate>Entering the void...</SubText>
          </>
        ) : showCreateAccount ? (
          <NoAccountSection>
            <WelcomeText>Enter the Void</WelcomeText>
            <NoAccountText>
              Create your account to join tournaments and compete.
            </NoAccountText>
            <CreateAccountButton onClick={handleCreateAccount}>
              Create Account
            </CreateAccountButton>
          </NoAccountSection>
        ) : (
          <>
            <VoidSymbol>
              <VoidCore />
            </VoidSymbol>
            <WelcomeText>Welcome</WelcomeText>
            <SubText $animate>Verifying identity...</SubText>
          </>
        )}
      </ProfileSection>
      
      {shouldRedirect && (
        <ProgressContainer>
          <ProgressBar duration={redirectDelay} />
        </ProgressContainer>
      )}
    </SplashContainer>
  );
};

export default Splash;
