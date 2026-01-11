import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

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
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const BackLink = styled(Link)`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Main = styled.main`
  max-width: 560px;
  margin: 0 auto;
  padding: 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const PageTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.35rem;
  letter-spacing: -0.02em;
`;

const PageSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
`;

const Section = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  padding: 1rem;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const SectionIcon = styled.span`
  font-size: 1rem;
  opacity: 0.6;
`;

const SectionTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  
  @media (max-width: 500px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FormGroup = styled.div`
  flex: 1;
`;

const Label = styled.label`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  
  ${({ theme, $variant }) => $variant === 'primary' ? `
    background: ${theme.accent};
    color: ${theme.signalWhite};
    border: none;
    
    &:hover:not(:disabled) {
      background: ${theme.accentHover};
      transform: translateY(-2px);
      box-shadow: 0 8px 24px ${theme.accentGlow};
    }
  ` : `
    background: transparent;
    color: ${theme.text};
    border: 1px solid ${theme.border};
    
    &:hover:not(:disabled) {
      background: ${theme.backgroundAlt};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultBox = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 0.875rem 1rem;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  margin-top: 1rem;
  
  ${({ $type, theme }) => {
    switch ($type) {
      case 'success':
        return `background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2);`;
      case 'error':
        return `background: rgba(225, 75, 75, 0.1); color: ${theme.infraRed}; border: 1px solid rgba(225, 75, 75, 0.2);`;
      default:
        return `background: ${theme.accentMuted}; color: ${theme.accent}; border: 1px solid rgba(123, 92, 255, 0.2);`;
    }
  }}
`;

const UserCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  margin-top: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserName = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
`;

const UserHandle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.2rem;
`;

const RoleBadge = styled.span<{ $role: string }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${({ $role, theme }) => {
    switch ($role) {
      case 'admin':
        return `background: ${theme.accentMuted}; color: ${theme.accent};`;
      case 'organizer':
        return `background: rgba(34, 197, 94, 0.1); color: #22c55e;`;
      default:
        return `background: ${theme.steelGray}; color: ${theme.textMuted};`;
    }
  }}
`;

const PermissionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PermissionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PermissionText = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const AccessTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const AccessText = styled.p`
  font-family: 'Inter', sans-serif;
  color: ${({ theme }) => theme.textMuted};
`;

export default function AdminUsersPage() {
  const { user, isLoading } = useUser();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('organizer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [foundUser, setFoundUser] = useState<{ id: string; username: string; displayName: string; role: string } | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    setResult(null);
    setFoundUser(null);

    try {
      const res = await fetch(`/api/user/role?username=${encodeURIComponent(username)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'User not found');
      }

      setFoundUser(data.user);
      setResult({ type: 'info', message: `Found user: ${data.user.username || data.user.id}` });
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Failed to find user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!foundUser) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/user/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: foundUser.id,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setFoundUser(data.user);
      setResult({ type: 'success', message: data.message });
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update role' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <Container>
        <Head>
          <title>User Management | Into the Void</title>
        </Head>
        <Header>
          <Logo href="/dashboard">Into the Void</Logo>
          <BackLink href="/dashboard">← Dashboard</BackLink>
        </Header>
        <Main>
          <AccessDenied>
            <AccessTitle>Access Restricted</AccessTitle>
            <AccessText>Only administrators can access this page.</AccessText>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>User Management | Into the Void</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Into the Void</Logo>
        <BackLink href="/dashboard">← Dashboard</BackLink>
      </Header>

      <Main>
        <PageHeader>
          <PageTitle>User Management</PageTitle>
          <PageSubtitle>Manage organizers and administrators</PageSubtitle>
        </PageHeader>

        <Section>
          <SectionHeader>
            <SectionIcon>○</SectionIcon>
            <SectionTitle>Update User Role</SectionTitle>
          </SectionHeader>
          
          <Form onSubmit={handleLookup}>
            <FormRow>
              <FormGroup>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                />
              </FormGroup>
              <Button type="submit" $variant="secondary" disabled={isSubmitting || !username.trim()}>
                {isSubmitting ? 'Searching...' : 'Find User'}
              </Button>
            </FormRow>
          </Form>

          {foundUser && (
            <UserCard>
              <UserInfo>
                <div>
                  <UserName>{foundUser.displayName || foundUser.username || foundUser.id}</UserName>
                  {foundUser.username && (
                    <UserHandle>@{foundUser.username}</UserHandle>
                  )}
                </div>
                <RoleBadge $role={foundUser.role}>{foundUser.role}</RoleBadge>
              </UserInfo>

              <FormRow style={{ marginTop: '1rem' }}>
                <FormGroup>
                  <Label htmlFor="role">Set Role</Label>
                  <Select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="user">User (basic access)</option>
                    <option value="organizer">Organizer (create tournaments)</option>
                    <option value="admin">Admin (full access)</option>
                  </Select>
                </FormGroup>
                <Button 
                  type="button" 
                  $variant="primary" 
                  onClick={handleUpdateRole}
                  disabled={isSubmitting || foundUser.role === role}
                >
                  {isSubmitting ? 'Updating...' : 'Update Role'}
                </Button>
              </FormRow>
            </UserCard>
          )}

          {result && (
            <ResultBox $type={result.type}>
              {result.message}
            </ResultBox>
          )}
        </Section>

        <Section style={{ marginTop: '1.5rem' }}>
          <SectionHeader>
            <SectionIcon>◇</SectionIcon>
            <SectionTitle>Role Permissions</SectionTitle>
          </SectionHeader>
          <PermissionList>
            <PermissionItem>
              <RoleBadge $role="user">User</RoleBadge>
              <PermissionText>Join tournaments and submit match results</PermissionText>
            </PermissionItem>
            <PermissionItem>
              <RoleBadge $role="organizer">Organizer</RoleBadge>
              <PermissionText>Create tournaments, pair teams, manage matches</PermissionText>
            </PermissionItem>
            <PermissionItem>
              <RoleBadge $role="admin">Admin</RoleBadge>
              <PermissionText>Full access including user management</PermissionText>
            </PermissionItem>
          </PermissionList>
        </Section>
      </Main>
    </Container>
  );
}
