import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

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
`;

const Logo = styled(Link)`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
`;

const BackLink = styled(Link)`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Main = styled.main`
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
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

const Section = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
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
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ theme, $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, ${theme.accent}, ${theme.accentGold});
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${theme.shadow};
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
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultBox = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  margin-top: 1rem;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `background: #22c55e15; color: #22c55e;`;
      case 'error':
        return `background: #ef444415; color: #ef4444;`;
      default:
        return `background: #3b82f615; color: #3b82f6;`;
    }
  }}
`;

const UserCard = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
  margin-top: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserName = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const RoleBadge = styled.span<{ $role: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
  
  ${({ $role, theme }) => {
    switch ($role) {
      case 'admin':
        return `background: ${theme.accent}20; color: ${theme.accent};`;
      case 'organizer':
        return `background: ${theme.accentGold}20; color: ${theme.accentGold};`;
      default:
        return `background: ${theme.textSecondary}20; color: ${theme.textSecondary};`;
    }
  }}
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const AccessTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
`;

const AccessText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
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
          <title>Admin - User Management | Renaissance City Games</title>
        </Head>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href="/dashboard">← Dashboard</BackLink>
        </Header>
        <Main>
          <AccessDenied>
            <AccessTitle>Access Denied</AccessTitle>
            <AccessText>Only administrators can access this page.</AccessText>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>Admin - User Management | Renaissance City Games</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <BackLink href="/dashboard">← Dashboard</BackLink>
      </Header>

      <Main>
        <PageTitle>User Management</PageTitle>
        <PageSubtitle>Manage organizers and administrators</PageSubtitle>

        <Section>
          <SectionTitle>Add or Update User Role</SectionTitle>
          
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
                    <p style={{ fontSize: '0.85rem', color: 'inherit', opacity: 0.7 }}>
                      @{foundUser.username}
                    </p>
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
                    <option value="organizer">Organizer (can create tournaments)</option>
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
          <SectionTitle>Role Permissions</SectionTitle>
          <div style={{ fontFamily: 'Crimson Pro, Georgia, serif' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              <RoleBadge $role="user" style={{ marginRight: '0.5rem' }}>User</RoleBadge>
              Can join tournaments and submit match results
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              <RoleBadge $role="organizer" style={{ marginRight: '0.5rem' }}>Organizer</RoleBadge>
              Can create and manage tournaments, pair teams, override results
            </p>
            <p>
              <RoleBadge $role="admin" style={{ marginRight: '0.5rem' }}>Admin</RoleBadge>
              Full access including user role management
            </p>
          </div>
        </Section>
      </Main>
    </Container>
  );
}
