import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';

interface Game {
  id: string;
  type: string;
  name: string;
  description: string;
  isTeamGame: boolean;
  playersPerTeam: number;
  minPlayers: number;
  maxPlayers: number;
}

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

const PageTitle = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
`;

const PageSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
`;

const FormSection = styled.div`
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
  font-size: 1.1rem;
  opacity: 0.6;
`;

const SectionTitle = styled.h2`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
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
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
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
  transition: border-color 0.2s ease;
  
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

const GameInfo = styled.div`
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 4px;
  padding: 1rem;
  margin-top: 0.75rem;
  border: 1px solid ${({ theme }) => theme.border};
`;

const GameInfoTitle = styled.p`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const GameInfoText = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.25rem;
`;

const SubmitButton = styled.button`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.signalWhite};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
  
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

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.infraRed};
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  background: rgba(225, 75, 75, 0.1);
  border: 1px solid rgba(225, 75, 75, 0.2);
  border-radius: 4px;
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

const getGameIcon = (gameType: string): string => {
  switch (gameType) {
    case 'pool': return '🎱';
    case 'chess': return '♟';
    case 'euchre': return '🃏';
    default: return '🎮';
  }
};

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    gameId: '',
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

  const selectedGame = games.find(g => g.id === formData.gameId);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill min/max when game is selected
    if (name === 'gameId') {
      const game = games.find(g => g.id === value);
      if (game) {
        setFormData(prev => ({
          ...prev,
          gameId: value,
          minParticipants: String(game.minPlayers),
          maxParticipants: String(game.maxPlayers),
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const body = {
        gameId: formData.gameId,
        name: formData.name,
        description: formData.description || undefined,
        minParticipants: parseInt(formData.minParticipants, 10),
        maxParticipants: parseInt(formData.maxParticipants, 10),
        entryFee: formData.entryFee ? parseInt(formData.entryFee, 10) * 100 : undefined,
        prizePool: formData.prizePool ? parseInt(formData.prizePool, 10) * 100 : undefined,
        bestOf: parseInt(formData.bestOf, 10),
        location: formData.location || undefined,
        startTime: formData.startTime || undefined,
        registrationDeadline: formData.registrationDeadline || undefined,
      };

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tournament');
      }

      // Redirect to the new tournament
      router.push(`/tournaments/${data.tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoading) {
    return <Loading text="Loading..." />;
  }

  const canCreate = user && (user.role === 'admin' || user.role === 'organizer');

  if (!canCreate) {
    return (
      <Container>
        <Head>
          <title>Create Tournament | Into the Void</title>
        </Head>
        <Header>
          <Logo href="/dashboard">Into the Void</Logo>
          <BackLink href="/tournaments">← Back to Tournaments</BackLink>
        </Header>
        <Main>
          <AccessDenied>
            <AccessTitle>Access Restricted</AccessTitle>
            <AccessText>
              Only organizers and administrators can create tournaments.
            </AccessText>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  return (
    <Container>
      <Head>
        <title>Create Tournament | Into the Void</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Into the Void</Logo>
        <BackLink href="/tournaments">← Back to Tournaments</BackLink>
      </Header>

      <Main>
        <PageHeader>
          <PageTitle>Create Tournament</PageTitle>
          <PageSubtitle>Set up a new competitive ritual</PageSubtitle>
        </PageHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionHeader>
              <SectionIcon>○</SectionIcon>
              <SectionTitle>Game Selection</SectionTitle>
            </SectionHeader>
            
            <FormGroup>
              <Label htmlFor="gameId">Game Type *</Label>
              <Select
                id="gameId"
                name="gameId"
                value={formData.gameId}
                onChange={handleChange}
                required
              >
                <option value="">Select a game...</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>
                    {getGameIcon(game.type)} {game.name} {game.isTeamGame ? '(Teams)' : '(Solo)'}
                  </option>
                ))}
              </Select>
              
              {selectedGame && (
                <GameInfo>
                  <GameInfoTitle>{getGameIcon(selectedGame.type)} {selectedGame.name}</GameInfoTitle>
                  <GameInfoText>{selectedGame.description}</GameInfoText>
                  <GameInfoText>
                    Players: {selectedGame.minPlayers} - {selectedGame.maxPlayers}
                    {selectedGame.isTeamGame && ` (${selectedGame.playersPerTeam} per team)`}
                  </GameInfoText>
                </GameInfo>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Friday Night Championship"
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
                placeholder="Describe the tournament, rules, and what to expect..."
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
                <Label htmlFor="minParticipants">Minimum *</Label>
                <Input
                  id="minParticipants"
                  name="minParticipants"
                  type="number"
                  value={formData.minParticipants}
                  onChange={handleChange}
                  min={selectedGame?.minPlayers || 2}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="maxParticipants">Maximum *</Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  max={selectedGame?.maxPlayers || 100}
                  required
                />
              </FormGroup>
            </InputRow>
            
            <HelpText>
              Elimination type determined automatically based on participant count.
            </HelpText>
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
              <HelpText>
                Number of games per match (winner takes majority)
              </HelpText>
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
            
            <HelpText>
              Payment features coming soon. Amounts shown for informational purposes.
            </HelpText>
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

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Tournament'}
          </SubmitButton>
        </Form>
      </Main>
    </Container>
  );
}
