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
}

export function UserHeader({ showBack = false, backHref = '/dashboard' }: UserHeaderProps) {
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
      </Header>
      <HeaderSpacer />
    </>
  );
}
