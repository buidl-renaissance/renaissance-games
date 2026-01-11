import React, { useEffect, useState } from 'react';
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
  status: string;
  minParticipants: number;
  maxParticipants: number;
  eliminationType: string | null;
}

interface Game {
  id: string;
  type: string;
  name: string;
  isTeamGame: boolean;
  playersPerTeam: number;
}

interface Participant {
  id: string;
  tournamentId: string;
  userId: string | null;
  teamId: string | null;
  status: string;
  seed: number | null;
}

interface Team {
  id: string;
  name: string;
  captainId: string;
  isComplete: boolean;
}

interface User {
  id: string;
  username: string | null;
  displayName: string | null;
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
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const Main = styled.main`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'registration':
        return `background: ${theme.accent}20; color: ${theme.accent};`;
      case 'ready':
        return `background: ${theme.accentGold}30; color: ${theme.accentGold};`;
      case 'in_progress':
        return `background: #22c55e20; color: #22c55e;`;
      default:
        return `background: ${theme.border}; color: ${theme.textSecondary};`;
    }
  }}
`;

const Section = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out 0.1s both;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ theme, $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${theme.accent}, ${theme.accentGold});
          color: white;
          border: none;
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px ${theme.shadow};
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          border: none;
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: transparent;
          color: ${theme.text};
          border: 1px solid ${theme.border};
          &:hover:not(:disabled) {
            background: ${theme.backgroundAlt};
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ParticipantGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ParticipantCard = styled.div<{ $selected?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${({ theme, $selected }) => $selected ? `${theme.accent}15` : theme.backgroundAlt};
  border: 1px solid ${({ theme, $selected }) => $selected ? theme.accent : 'transparent'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.accent}10;
  }
`;

const ParticipantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const ParticipantName = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const ParticipantMeta = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const ParticipantStatus = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'waitlist':
        return `background: ${theme.accentGold}20; color: ${theme.accentGold};`;
      case 'checked_in':
        return `background: #22c55e20; color: #22c55e;`;
      default:
        return `background: ${theme.accent}20; color: ${theme.accent};`;
    }
  }}
`;

const TeamPairingSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const TeamPairingTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 1rem;
`;

const PairingRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Select = styled.select`
  flex: 1;
  padding: 0.75rem 1rem;
  font-family: 'Crimson Pro', Georgia, serif;
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

const Input = styled.input`
  padding: 0.75rem 1rem;
  font-family: 'Crimson Pro', Georgia, serif;
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

const InfoBox = styled.div<{ $type?: 'info' | 'warning' | 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  
  ${({ $type, theme }) => {
    switch ($type) {
      case 'warning':
        return `background: ${theme.accentGold}15; color: ${theme.accentGold};`;
      case 'success':
        return `background: #22c55e15; color: #22c55e;`;
      case 'error':
        return `background: #ef444415; color: #ef4444;`;
      default:
        return `background: ${theme.backgroundAlt}; color: ${theme.textSecondary};`;
    }
  }}
`;

const EmptyText = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  color: ${({ theme }) => theme.textSecondary};
  font-style: italic;
  text-align: center;
  padding: 1rem;
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  ready: 'Ready to Start',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TournamentAdminPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: isUserLoading } = useUser();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [waitlist, setWaitlist] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Team pairing state
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');

  const isOrganizer = user && tournament && (
    user.id === tournament.organizerId ||
    user.role === 'admin'
  );

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data.tournament);
        setGame(data.game);
        setParticipants(data.participants || []);
        setTeams(data.teams || []);
        setWaitlist(data.waitlist || []);
        setParticipantCount(data.participantCount || 0);
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setMessage({ type: 'success', text: `Tournament status updated to ${STATUS_LABELS[status]}` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  const generateBracket = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/tournaments/${id}/bracket`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate bracket');
      }

      setMessage({ type: 'success', text: 'Bracket generated successfully!' });
      router.push(`/tournaments/${id}/bracket`);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to generate bracket' });
    } finally {
      setActionLoading(false);
    }
  };

  const createTeam = async () => {
    if (!teamName.trim() || selectedPlayers.length !== (game?.playersPerTeam || 2)) {
      setMessage({ type: 'error', text: `Please provide a team name and select ${game?.playersPerTeam || 2} players` });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: id,
          teamName,
          memberIds: selectedPlayers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      setMessage({ type: 'success', text: `Team "${teamName}" created successfully!` });
      setTeamName('');
      setSelectedPlayers([]);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create team' });
    } finally {
      setActionLoading(false);
    }
  };

  const togglePlayerSelection = (participantId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      }
      if (prev.length < (game?.playersPerTeam || 2)) {
        return [...prev, participantId];
      }
      return prev;
    });
  };

  if (isLoading || isUserLoading) {
    return <Loading text="Loading..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href="/tournaments">← Tournaments</BackLink>
        </Header>
        <Main>
          <InfoBox $type="error">Tournament not found</InfoBox>
        </Main>
      </Container>
    );
  }

  if (!isOrganizer) {
    return (
      <Container>
        <Header>
          <Logo href="/dashboard">Renaissance City</Logo>
          <BackLink href={`/tournaments/${id}`}>← Back to Tournament</BackLink>
        </Header>
        <Main>
          <AccessDenied>
            <AccessTitle>Access Denied</AccessTitle>
            <EmptyText>Only tournament organizers can access this page.</EmptyText>
          </AccessDenied>
        </Main>
      </Container>
    );
  }

  const canOpenRegistration = tournament.status === 'draft';
  const canGenerateBracket = (tournament.status === 'registration' || tournament.status === 'ready') && 
    participantCount >= tournament.minParticipants;
  const canStartTournament = tournament.status === 'ready';
  const canCompleteTournament = tournament.status === 'in_progress';

  // Get unassigned players for team pairing (solo registrations not yet on a team)
  const unassignedPlayers = participants.filter(p => !p.teamId && p.status !== 'waitlist');

  return (
    <Container>
      <Head>
        <title>Manage {tournament.name} | Renaissance City Games</title>
      </Head>

      <Header>
        <Logo href="/dashboard">Renaissance City</Logo>
        <BackLink href={`/tournaments/${id}`}>← Back to Tournament</BackLink>
      </Header>

      <Main>
        <PageHeader>
          <TitleRow>
            <PageTitle>Manage Tournament</PageTitle>
            <StatusBadge $status={tournament.status}>
              {STATUS_LABELS[tournament.status]}
            </StatusBadge>
          </TitleRow>
        </PageHeader>

        {message && (
          <InfoBox $type={message.type}>
            {message.text}
          </InfoBox>
        )}

        {/* Status Actions */}
        <Section>
          <SectionTitle>Tournament Status</SectionTitle>
          <ActionButtons>
            {canOpenRegistration && (
              <ActionButton 
                $variant="primary" 
                onClick={() => updateStatus('registration')}
                disabled={actionLoading}
              >
                Open Registration
              </ActionButton>
            )}
            {canGenerateBracket && (
              <ActionButton 
                $variant="primary" 
                onClick={generateBracket}
                disabled={actionLoading}
              >
                Generate Bracket
              </ActionButton>
            )}
            {canStartTournament && (
              <ActionButton 
                $variant="primary" 
                onClick={() => updateStatus('in_progress')}
                disabled={actionLoading}
              >
                Start Tournament
              </ActionButton>
            )}
            {canCompleteTournament && (
              <ActionButton 
                onClick={() => updateStatus('completed')}
                disabled={actionLoading}
              >
                Complete Tournament
              </ActionButton>
            )}
            {tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
              <ActionButton 
                $variant="danger" 
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this tournament?')) {
                    updateStatus('cancelled');
                  }
                }}
                disabled={actionLoading}
              >
                Cancel Tournament
              </ActionButton>
            )}
          </ActionButtons>

          {tournament.status === 'draft' && (
            <InfoBox $type="info" style={{ marginTop: '1rem' }}>
              Open registration to allow players to join the tournament.
            </InfoBox>
          )}

          {tournament.status === 'registration' && participantCount < tournament.minParticipants && (
            <InfoBox $type="warning" style={{ marginTop: '1rem' }}>
              Need at least {tournament.minParticipants} participants to generate bracket 
              (currently {participantCount})
            </InfoBox>
          )}
        </Section>

        {/* Participants */}
        <Section>
          <SectionTitle>
            Participants ({participantCount}/{tournament.maxParticipants})
          </SectionTitle>

          {game?.isTeamGame ? (
            <>
              {teams.length > 0 ? (
                <ParticipantGrid>
                  {teams.map((team, index) => (
                    <ParticipantCard key={team.id}>
                      <ParticipantInfo>
                        <ParticipantName>{index + 1}. {team.name}</ParticipantName>
                        <ParticipantMeta>Captain: {team.captainId.slice(0, 8)}</ParticipantMeta>
                      </ParticipantInfo>
                      <ParticipantStatus $status={team.isComplete ? 'registered' : 'forming'}>
                        {team.isComplete ? 'Ready' : 'Forming'}
                      </ParticipantStatus>
                    </ParticipantCard>
                  ))}
                </ParticipantGrid>
              ) : (
                <EmptyText>No teams registered yet</EmptyText>
              )}

              {/* Team Pairing Section */}
              {unassignedPlayers.length > 0 && tournament.status === 'registration' && (
                <TeamPairingSection>
                  <TeamPairingTitle>Manual Team Pairing</TeamPairingTitle>
                  <InfoBox $type="info">
                    Select {game.playersPerTeam} players and provide a team name to create a team.
                  </InfoBox>

                  <PairingRow>
                    <Input
                      type="text"
                      placeholder="Team name..."
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <ActionButton 
                      $variant="primary"
                      onClick={createTeam}
                      disabled={actionLoading || selectedPlayers.length !== game.playersPerTeam || !teamName.trim()}
                    >
                      Create Team
                    </ActionButton>
                  </PairingRow>

                  <ParticipantGrid>
                    {unassignedPlayers.map(p => (
                      <ParticipantCard 
                        key={p.id}
                        $selected={selectedPlayers.includes(p.userId || '')}
                        onClick={() => p.userId && togglePlayerSelection(p.userId)}
                      >
                        <ParticipantInfo>
                          <ParticipantName>Player {p.userId?.slice(0, 8)}</ParticipantName>
                        </ParticipantInfo>
                        {selectedPlayers.includes(p.userId || '') && (
                          <ParticipantStatus $status="checked_in">Selected</ParticipantStatus>
                        )}
                      </ParticipantCard>
                    ))}
                  </ParticipantGrid>
                </TeamPairingSection>
              )}
            </>
          ) : (
            participants.length > 0 ? (
              <ParticipantGrid>
                {participants.map((p, index) => (
                  <ParticipantCard key={p.id}>
                    <ParticipantInfo>
                      <ParticipantName>
                        {p.status === 'waitlist' ? 'W' : index + 1}. Player {p.userId?.slice(0, 8)}
                      </ParticipantName>
                      {p.seed && <ParticipantMeta>Seed: {p.seed}</ParticipantMeta>}
                    </ParticipantInfo>
                    <ParticipantStatus $status={p.status}>
                      {p.status === 'waitlist' ? 'Waitlist' : 'Registered'}
                    </ParticipantStatus>
                  </ParticipantCard>
                ))}
              </ParticipantGrid>
            ) : (
              <EmptyText>No players registered yet</EmptyText>
            )
          )}
        </Section>

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <Section>
            <SectionTitle>Waitlist ({waitlist.length})</SectionTitle>
            <ParticipantGrid>
              {waitlist.map((p, index) => (
                <ParticipantCard key={p.id}>
                  <ParticipantInfo>
                    <ParticipantName>#{index + 1} Player {p.userId?.slice(0, 8)}</ParticipantName>
                  </ParticipantInfo>
                  <ParticipantStatus $status="waitlist">Waitlist</ParticipantStatus>
                </ParticipantCard>
              ))}
            </ParticipantGrid>
          </Section>
        )}

        {/* Quick Links */}
        {(tournament.status === 'ready' || tournament.status === 'in_progress') && (
          <Section>
            <SectionTitle>Quick Links</SectionTitle>
            <ActionButtons>
              <ActionButton as={Link} href={`/tournaments/${id}/bracket`}>
                View Bracket
              </ActionButton>
              <ActionButton as={Link} href={`/tournaments/${id}`}>
                Public Page
              </ActionButton>
            </ActionButtons>
          </Section>
        )}
      </Main>
    </Container>
  );
}
