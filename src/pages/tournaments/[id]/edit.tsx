import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

interface Tournament {
  id: string;
  gameId: string;
  organizerId: string;
  name: string;
  description: string | null;
  status: string;
  minParticipants: number;
  maxParticipants: number;
  eliminationType: string | null;
  entryFee: number | null;
  prizePool: number | null;
  bestOf: number;
  location: string | null;
  startTime: string | null;
  registrationDeadline: string | null;
}

interface Game {
  id: string;
  type: string;
  name: string;
  isTeamGame: boolean;
  playersPerTeam: number;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
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

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
  letter-spacing: -0.02em;
`;

const GameBadge = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.35rem;
  display: block;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'registration':
        return `background: ${theme.accentMuted}; color: ${theme.accent};`;
      case 'ready':
        return `background: rgba(34, 197, 94, 0.1); color: #22c55e;`;
      case 'in_progress':
        return `background: ${theme.accentMuted}; color: ${theme.accent}; box-shadow: 0 0 12px ${theme.accentGlow};`;
      default:
        return `background: ${theme.steelGray}; color: ${theme.textMuted};`;
    }
  }}
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
`;

const FormSection = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  padding: 1rem;
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

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
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
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  
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
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const HelpText = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.5rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.875rem 2rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.signalWhite};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.05em;
  
  ${({ $loading, theme }) => $loading && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        ${theme.signalWhite}20,
        transparent
      );
      background-size: 200% 100%;
      animation: ${shimmer} 1.5s infinite;
    }
  `}
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ theme }) => theme.accentGlow};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Link)`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.875rem 1.5rem;
  background: transparent;
  color: ${({ theme }) => theme.textMuted};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
    color: ${({ theme }) => theme.text};
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 0.875rem 1rem;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
  
  ${({ $type, theme }) => $type === 'success' 
    ? `background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2);`
    : `background: rgba(225, 75, 75, 0.1); color: ${theme.infraRed}; border: 1px solid rgba(225, 75, 75, 0.2);`
  }
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const AccessTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
`;

const AccessText = styled.p`
  font-family: 'Inter', sans-serif;
  color: ${({ theme }) => theme.textMuted};
`;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration',
  ready: 'Ready',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const getGameIcon = (gameType?: string): string => {
  switch (gameType) {
    case 'pool': return '🎱';
    case 'chess': return '♟';
    case 'euchre': return '🃏';
    default: return '○';
  }
};

export default function EditTournamentPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minParticipants: '',
    maxParticipants: '',
    entryFee: '',
    prizePool: '',
    bestOf: '1',
    location: '',
    startTime: '',
    registrationDeadline: '',
  });

  const isOrganizer = user && tournament && (
    user.id === tournament.organizerId ||
    user.role === 'admin' ||
    user.role === 'organizer'
  );

  const fetchTournament = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data.tournament);
        setGame(data.game);

        // Populate form with tournament data
        const t = data.tournament;
        setFormData({
          name: t.name || '',
          description: t.description || '',
          minParticipants: String(t.minParticipants || ''),
          maxParticipants: String(t.maxParticipants || ''),
          entryFee: t.entryFee ? String(t.entryFee / 100) : '',
          prizePool: t.prizePool ? String(t.prizePool / 100) : '',
          bestOf: String(t.bestOf || 1),
          location: t.location || '',
          startTime: t.startTime ? formatDateTimeLocal(t.startTime) : '',
          registrationDeadline: t.registrationDeadline ? formatDateTimeLocal(t.registrationDeadline) : '',
        });
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage(null); // Clear message on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || null,
        minParticipants: parseInt(formData.minParticipants, 10),
        maxParticipants: parseInt(formData.maxParticipants, 10),
        entryFee: formData.entryFee ? parseInt(formData.entryFee, 10) * 100 : 0,
        prizePool: formData.prizePool ? parseInt(formData.prizePool, 10) * 100 : 0,
        bestOf: parseInt(formData.bestOf, 10),
        location: formData.location || null,
      };

      if (formData.startTime) {
        body.startTime = new Date(formData.startTime).toISOString();
      }
      if (formData.registrationDeadline) {
        body.registrationDeadline = new Date(formData.registrationDeadline).toISOString();
      }

      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update tournament');
      }

      setMessage({ type: 'success', text: 'Tournament updated successfully' });
      setTournament(data.tournament);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/tournaments/${id}/admin`);
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update tournament' });
    } finally {
      setIsSaving(false);
    }
  };

  // Only show loading for data fetch
  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Into the Void</Logo>
          <BackLink href="/tournaments">← Back to Tournaments</BackLink>
        </Header>
        <Main>
          <Message $type="error">Tournament not found</Message>
        </Main>
      </Container>
    );
  }

  if (!isOrganizer) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Into the Void</Logo>
          <BackLink href={`/tournaments/${id}`}>← Back to Tournament</BackLink>
        </Header>
        <Main>
          <AccessDenied>
            <AccessTitle>Access Restricted</AccessTitle>
            <AccessText>Only tournament organizers can edit this tournament.</AccessText>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  const isLocked = tournament.status === 'completed' || tournament.status === 'cancelled';

  return (
    <Container>
      <Head>
        <title>Edit {tournament.name} | Into the Void</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Into the Void</Logo>
        <BackLink href={`/tournaments/${id}/admin`}>← Back to Admin</BackLink>
      </Header>

      <Main>
        <PageHeader>
          <TitleRow>
            <div>
              <PageTitle>Edit Tournament</PageTitle>
              <GameBadge>
                {getGameIcon(game?.type)} {game?.name || 'Game'} • {game?.isTeamGame ? 'Teams' : 'Solo'}
              </GameBadge>
            </div>
            <StatusBadge $status={tournament.status}>
              {STATUS_LABELS[tournament.status]}
            </StatusBadge>
          </TitleRow>
        </PageHeader>

        {message && (
          <Message $type={message.type}>{message.text}</Message>
        )}

        {isLocked ? (
          <Message $type="error">
            This tournament is {tournament.status} and cannot be edited.
          </Message>
        ) : (
          <Form onSubmit={handleSubmit}>
            <FormSection>
              <SectionHeader>
                <SectionIcon>○</SectionIcon>
                <SectionTitle>Basic Information</SectionTitle>
              </SectionHeader>

              <FormGroup>
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tournament name..."
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the tournament, rules, and expectations..."
                />
              </FormGroup>
            </FormSection>

            <FormSection>
              <SectionHeader>
                <SectionIcon>⬡</SectionIcon>
                <SectionTitle>Participants</SectionTitle>
              </SectionHeader>

              <InputRow>
                <FormGroup>
                  <Label htmlFor="minParticipants">Minimum</Label>
                  <Input
                    id="minParticipants"
                    name="minParticipants"
                    type="number"
                    value={formData.minParticipants}
                    onChange={handleChange}
                    min={2}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="maxParticipants">Maximum</Label>
                  <Input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    min={2}
                    required
                  />
                </FormGroup>
              </InputRow>
            </FormSection>

            <FormSection>
              <SectionHeader>
                <SectionIcon>◇</SectionIcon>
                <SectionTitle>Match Format</SectionTitle>
              </SectionHeader>

              <FormGroup>
                <Label htmlFor="bestOf">Best Of</Label>
                <Select
                  id="bestOf"
                  name="bestOf"
                  value={formData.bestOf}
                  onChange={handleChange}
                >
                  <option value="1">Single Game</option>
                  <option value="3">Best of 3</option>
                  <option value="5">Best of 5</option>
                  <option value="7">Best of 7</option>
                </Select>
                <HelpText>Number of games per match (winner takes majority)</HelpText>
              </FormGroup>
            </FormSection>

            <FormSection>
              <SectionHeader>
                <SectionIcon>◎</SectionIcon>
                <SectionTitle>Entry & Prizes</SectionTitle>
              </SectionHeader>

              <InputRow>
                <FormGroup>
                  <Label htmlFor="entryFee">Entry Fee ($)</Label>
                  <Input
                    id="entryFee"
                    name="entryFee"
                    type="number"
                    value={formData.entryFee}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="prizePool">Prize Pool ($)</Label>
                  <Input
                    id="prizePool"
                    name="prizePool"
                    type="number"
                    value={formData.prizePool}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </FormGroup>
              </InputRow>
              <HelpText>Payment features coming soon.</HelpText>
            </FormSection>

            <FormSection>
              <SectionHeader>
                <SectionIcon>◈</SectionIcon>
                <SectionTitle>Location & Schedule</SectionTitle>
              </SectionHeader>

              <FormGroup>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., The Renaissance Center, Detroit"
                />
              </FormGroup>

              <InputRow>
                <FormGroup>
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    name="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </FormGroup>
              </InputRow>
            </FormSection>

            <ButtonRow>
              <CancelButton href={`/tournaments/${id}/admin`}>Cancel</CancelButton>
              <SubmitButton type="submit" disabled={isSaving} $loading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </SubmitButton>
            </ButtonRow>
          </Form>
        )}
      </Main>
    </Container>
  );
}
