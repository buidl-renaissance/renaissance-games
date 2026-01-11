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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
`;

const FormSection = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
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
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
  
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

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const HelpText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 0.35rem;
  font-style: italic;
`;

const GameInfo = styled.div`
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.75rem;
`;

const GameInfoTitle = styled.p`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const GameInfoText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.25rem;
`;

const SubmitButton = styled.button`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}, ${({ theme }) => theme.accentGold});
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.shadow};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  background: #ef444420;
  border-radius: 8px;
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
          <title>Create Tournament | Renaissance City Games</title>
        </Head>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href="/tournaments">← Back to Tournaments</BackLink>
        </Header>
        <Main>
          <AccessDenied>
            <AccessTitle>Access Denied</AccessTitle>
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
        <title>Create Tournament | Renaissance City Games</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <BackLink href="/tournaments">← Back to Tournaments</BackLink>
      </Header>

      <Main>
        <PageTitle>Create Tournament</PageTitle>
        <PageSubtitle>Set up a new competition for players to join</PageSubtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>Basic Information</SectionTitle>
            
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
                    {game.name} {game.isTeamGame ? '(Teams)' : '(Solo)'}
                  </option>
                ))}
              </Select>
              
              {selectedGame && (
                <GameInfo>
                  <GameInfoTitle>{selectedGame.name}</GameInfoTitle>
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
                placeholder="e.g., Friday Night Euchre Championship"
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
                placeholder="Describe your tournament, rules, and what to expect..."
              />
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>Participant Limits</SectionTitle>
            
            <InputRow>
              <FormGroup>
                <Label htmlFor="minParticipants">Minimum Participants *</Label>
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
                <Label htmlFor="maxParticipants">Maximum Participants *</Label>
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
              Elimination type will be determined automatically based on participant count.
            </HelpText>
          </FormSection>

          <FormSection>
            <SectionTitle>Match Settings</SectionTitle>
            
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
            <SectionTitle>Entry & Prizes (Optional)</SectionTitle>
            
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
            <SectionTitle>Location & Schedule (Optional)</SectionTitle>
            
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
