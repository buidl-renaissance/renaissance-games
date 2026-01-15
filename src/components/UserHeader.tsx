import React, { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { useUser } from '@/contexts/UserContext';

const Header = styled.header`
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
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const BackButton = styled(Link)`
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
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const HeaderSpacer = styled.div`
  height: 60px;
`;

interface UserHeaderProps {
  showBack?: boolean;
  backHref?: string;
  hideActions?: boolean;
}

export function UserHeader({ showBack = false, backHref = '/dashboard', hideActions = false }: UserHeaderProps) {
  const { user } = useUser();
  const [imageError, setImageError] = useState(false);

  if (!user) return null;

  const displayName = user.displayName || user.username || 'Player';
  const initials = displayName.slice(0, 2).toUpperCase();
  const canCreateTournament = user.role === 'admin' || user.role === 'organizer';

  return (
    <>
      <Header>
        <UserSection>
          {showBack ? (
            <BackButton href={backHref} title="Back">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </BackButton>
          ) : (
            <Link href="/dashboard">
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
            </Link>
          )}
          <UserName>{displayName}</UserName>
        </UserSection>
        {!hideActions && (
          <HeaderRight>
            {canCreateTournament && (
              <CreateButton href="/tournaments/create" title="Create Tournament">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </CreateButton>
            )}
            {user.role === 'admin' && (
              <IconButton href="/admin/users" title="Admin">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </IconButton>
            )}
          </HeaderRight>
        )}
      </Header>
      <HeaderSpacer />
    </>
  );
}
