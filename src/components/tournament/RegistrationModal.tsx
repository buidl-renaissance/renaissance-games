import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

// Types
interface Game {
  id: string;
  type: string;
  name: string;
  isTeamGame: boolean;
  playersPerTeam: number;
}

interface Tournament {
  id: string;
  name: string;
  maxParticipants: number;
}

interface SearchedUser {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  game: Game | null;
  participantCount: number;
  onSuccess: () => void;
}

type ModalStep = 'phone' | 'pin' | 'register' | 'teamName' | 'partner' | 'complete';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
  
  &:hover {
    color: ${({ theme }) => theme.text};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const StepIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $active, $completed }) => 
    $active ? theme.accent : 
    $completed ? theme.accent : 
    theme.border};
  opacity: ${({ $active, $completed }) => $active || $completed ? 1 : 0.5};
  transition: all 0.2s ease;
`;

const StepTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem 0;
`;

const StepDescription = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 1.25rem 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const Input = styled.input<{ $readOnly?: boolean }>`
  background: ${({ theme, $readOnly }) => $readOnly ? theme.accentMuted : theme.backgroundAlt};
  border: 1px solid ${({ theme, $readOnly }) => $readOnly ? `${theme.accent}40` : theme.border};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 16px;
  color: ${({ theme, $readOnly }) => $readOnly ? theme.accent : theme.text};
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; $loading?: boolean }>`
  padding: 0.875rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  transition: all 0.15s ease;
  
  ${({ theme, $variant }) => $variant === 'primary' ? `
    background: ${theme.accent};
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background: ${theme.accentHover};
      transform: translateY(-1px);
    }
  ` : `
    background: transparent;
    color: ${theme.textSecondary};
    border: 1px solid ${theme.border};
    
    &:hover:not(:disabled) {
      border-color: ${theme.textMuted};
      color: ${theme.text};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.danger};
`;

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.success};
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.625rem;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${({ theme, $active }) => $active ? theme.accentMuted : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.accent : theme.textSecondary};
  border: 1px solid ${({ theme, $active }) => $active ? theme.accent : theme.border};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surfaceHover};
  }
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.75rem;
`;

const SearchResultItem = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${({ theme, $selected }) => $selected ? theme.accentMuted : theme.backgroundAlt};
  border: 1px solid ${({ theme, $selected }) => $selected ? theme.accent : theme.border};
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.textMuted};
  }
`;

const Avatar = styled.div<{ $url?: string | null }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme, $url }) => $url ? `url(${$url}) center/cover` : theme.accentMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const UserName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const UserHandle = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const NoResults = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  text-align: center;
  padding: 1rem;
  font-style: italic;
`;

const PhoneDisplay = styled.div`
  background: ${({ theme }) => theme.accentMuted};
  border: 1px solid ${({ theme }) => theme.accent}40;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  margin-bottom: 0.5rem;
`;

// Helpers
const formatPhoneNumber = (value: string): string => {
  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return hasPlus ? '+' : '';
  
  let formatted = '';
  let digitIndex = 0;
  
  if (hasPlus || digits.startsWith('1')) {
    if (digits.startsWith('1')) {
      formatted = '+1 ';
      digitIndex = 1;
    } else {
      formatted = '+';
    }
  }
  
  const remaining = digits.slice(digitIndex);
  
  if (remaining.length === 0) return formatted.trim();
  
  if (remaining.length <= 3) {
    formatted += `(${remaining}`;
  } else if (remaining.length <= 6) {
    formatted += `(${remaining.slice(0, 3)}) ${remaining.slice(3)}`;
  } else {
    formatted += `(${remaining.slice(0, 3)}) ${remaining.slice(3, 6)}-${remaining.slice(6, 10)}`;
  }
  
  return formatted;
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// Component
export function RegistrationModal({
  isOpen,
  onClose,
  tournament,
  game,
  participantCount,
  onSuccess,
}: RegistrationModalProps) {
  // Step state
  const [step, setStep] = useState<ModalStep>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Phone step
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  
  // PIN step (existing user)
  const [pin, setPin] = useState('');
  
  // Register step (new user)
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Team step
  const [teamName, setTeamName] = useState('');
  
  // Partner step
  const [partnerMode, setPartnerMode] = useState<'search' | 'create'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<SearchedUser | null>(null);
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [searching, setSearching] = useState(false);
  
  // User data after auth
  const [userId, setUserId] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setError('');
      setPhone('');
      setPin('');
      setUsername('');
      setDisplayName('');
      setNewPin('');
      setConfirmPin('');
      setTeamName('');
      setPartnerMode('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPartner(null);
      setPartnerPhone('');
      setPartnerName('');
      setUserId(null);
    }
  }, [isOpen]);

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out the current user
        const filtered = (data.users || []).filter((u: SearchedUser) => u.id !== userId);
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [userId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (partnerMode === 'search' && searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, partnerMode, searchUsers]);

  // Get total steps based on game type
  const getTotalSteps = () => {
    if (game?.isTeamGame) return 4;
    return 2;
  };

  const getCurrentStepNumber = () => {
    switch (step) {
      case 'phone': return 1;
      case 'pin':
      case 'register': return 2;
      case 'teamName': return 3;
      case 'partner': return 4;
      default: return 1;
    }
  };

  // Phone step submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const normalized = phone.replace(/[\s\-\(\)]/g, '');
    setNormalizedPhone(normalized);
    
    try {
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.status === 404) {
        // Phone not found - new user
        setStep('register');
      } else if (data.requiresPin || data.needsSetPin) {
        setStep('pin');
      } else if (res.ok && data.user) {
        // Logged in without PIN (shouldn't happen but handle it)
        localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
        setUserId(data.user.id);
        proceedAfterAuth();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // PIN step submit
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, pin }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.status === 401) {
        setError('Invalid PIN');
        setPin('');
      } else if (res.ok && data.user) {
        localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
        setUserId(data.user.id);
        proceedAfterAuth();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Register step submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          username,
          name: displayName,
          pin: newPin,
        }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
        setUserId(data.user.id);
        proceedAfterAuth();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Proceed after authentication
  const proceedAfterAuth = () => {
    if (game?.isTeamGame) {
      setStep('teamName');
    } else {
      // Non-team game - register directly
      registerForTournament();
    }
  };

  // Register for tournament (non-team game)
  const registerForTournament = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep('complete');
        setTimeout(() => {
          onSuccess();
          onClose();
          // Refresh the page to update user context
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Team name step submit
  const handleTeamNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      setStep('partner');
    }
  };

  // Partner step submit
  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const body: {
        teamName: string;
        partnerId?: string;
        partnerPhone?: string;
        partnerName?: string;
      } = {
        teamName: teamName.trim(),
      };
      
      if (partnerMode === 'search' && selectedPartner) {
        body.partnerId = selectedPartner.id;
      } else if (partnerMode === 'create') {
        body.partnerPhone = partnerPhone.replace(/[\s\-\(\)]/g, '');
        body.partnerName = partnerName.trim();
      }
      
      const res = await fetch(`/api/tournaments/${tournament.id}/register-with-partner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep('complete');
        setTimeout(() => {
          onSuccess();
          onClose();
          // Refresh the page to update user context
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Skip partner (register solo, looking for teammate)
  const handleSkipPartner = async () => {
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamName.trim() }),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep('complete');
        setTimeout(() => {
          onSuccess();
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalSteps = getTotalSteps();
  const currentStep = getCurrentStepNumber();

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Register for {tournament.name}</ModalTitle>
          <CloseButton onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {step !== 'complete' && (
            <StepIndicator>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <StepDot 
                  key={i} 
                  $active={i + 1 === currentStep}
                  $completed={i + 1 < currentStep}
                />
              ))}
            </StepIndicator>
          )}

          {error && <ErrorMessage style={{ marginBottom: '1rem' }}>{error}</ErrorMessage>}

          {/* Phone Step */}
          {step === 'phone' && (
            <>
              <StepTitle>Enter your phone number</StepTitle>
              <StepDescription>We&apos;ll use this to identify your account</StepDescription>
              <Form onSubmit={handlePhoneSubmit}>
                <FormGroup>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="+1 (555) 123-4567"
                    required
                    autoFocus
                  />
                </FormGroup>
                <Button type="submit" $variant="primary" disabled={loading || phone.length < 10}>
                  {loading ? 'Checking...' : 'Continue'}
                </Button>
              </Form>
            </>
          )}

          {/* PIN Step (existing user) */}
          {step === 'pin' && (
            <>
              <StepTitle>Welcome back!</StepTitle>
              <StepDescription>Enter your 4-digit PIN to continue</StepDescription>
              <Form onSubmit={handlePinSubmit}>
                <FormGroup>
                  <Label>Phone Number</Label>
                  <PhoneDisplay>{phone}</PhoneDisplay>
                  <Button type="button" onClick={() => { setStep('phone'); setPin(''); }}>
                    Change Number
                  </Button>
                </FormGroup>
                <FormGroup>
                  <Label>PIN</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    required
                    autoFocus
                  />
                </FormGroup>
                <Button type="submit" $variant="primary" disabled={loading || pin.length !== 4}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form>
            </>
          )}

          {/* Register Step (new user) */}
          {step === 'register' && (
            <>
              <StepTitle>Create your account</StepTitle>
              <StepDescription>Just a few details to get started</StepDescription>
              <Form onSubmit={handleRegisterSubmit}>
                <FormGroup>
                  <Label>Phone Number</Label>
                  <PhoneDisplay>{phone}</PhoneDisplay>
                </FormGroup>
                <FormGroup>
                  <Label>Username</Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))}
                    placeholder="your_username"
                    required
                    autoFocus
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Display Name</Label>
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Create PIN</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Confirm PIN</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    required
                  />
                </FormGroup>
                <Button 
                  type="submit" 
                  $variant="primary" 
                  disabled={loading || !username || !displayName || newPin.length !== 4 || confirmPin.length !== 4}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </Form>
            </>
          )}

          {/* Team Name Step */}
          {step === 'teamName' && (
            <>
              <StepTitle>Name your team</StepTitle>
              <StepDescription>Choose a name for your {game?.name} team</StepDescription>
              <Form onSubmit={handleTeamNameSubmit}>
                <FormGroup>
                  <Label>Team Name</Label>
                  <Input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name..."
                    maxLength={30}
                    required
                    autoFocus
                  />
                </FormGroup>
                <Button type="submit" $variant="primary" disabled={!teamName.trim()}>
                  Continue
                </Button>
              </Form>
            </>
          )}

          {/* Partner Step */}
          {step === 'partner' && (
            <>
              <StepTitle>Add your partner</StepTitle>
              <StepDescription>
                Find your teammate or invite someone new
              </StepDescription>
              
              <ToggleGroup>
                <ToggleButton 
                  $active={partnerMode === 'search'}
                  onClick={() => { setPartnerMode('search'); setError(''); }}
                  type="button"
                >
                  Find Existing
                </ToggleButton>
                <ToggleButton 
                  $active={partnerMode === 'create'}
                  onClick={() => { setPartnerMode('create'); setError(''); }}
                  type="button"
                >
                  Add New
                </ToggleButton>
              </ToggleGroup>

              <Form onSubmit={handlePartnerSubmit}>
                {partnerMode === 'search' ? (
                  <>
                    <FormGroup>
                      <Label>Search by name or username</Label>
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        autoFocus
                      />
                    </FormGroup>
                    
                    {searching && <NoResults>Searching...</NoResults>}
                    
                    {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                      <NoResults>No users found</NoResults>
                    )}
                    
                    {searchResults.length > 0 && (
                      <SearchResults>
                        {searchResults.map((user) => (
                          <SearchResultItem
                            key={user.id}
                            type="button"
                            $selected={selectedPartner?.id === user.id}
                            onClick={() => setSelectedPartner(
                              selectedPartner?.id === user.id ? null : user
                            )}
                          >
                            <Avatar $url={user.pfpUrl}>
                              {!user.pfpUrl && getInitials(user.displayName || user.username)}
                            </Avatar>
                            <UserInfo>
                              <UserName>{user.displayName || user.username}</UserName>
                              {user.username && <UserHandle>@{user.username}</UserHandle>}
                            </UserInfo>
                          </SearchResultItem>
                        ))}
                      </SearchResults>
                    )}
                    
                    <ButtonRow>
                      <Button 
                        type="submit" 
                        $variant="primary" 
                        disabled={loading || !selectedPartner}
                        style={{ flex: 1 }}
                      >
                        {loading ? 'Registering...' : 'Complete Registration'}
                      </Button>
                    </ButtonRow>
                  </>
                ) : (
                  <>
                    <FormGroup>
                      <Label>Partner&apos;s Phone Number</Label>
                      <Input
                        type="tel"
                        value={partnerPhone}
                        onChange={(e) => setPartnerPhone(formatPhoneNumber(e.target.value))}
                        placeholder="+1 (555) 123-4567"
                        required
                        autoFocus
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Partner&apos;s Name</Label>
                      <Input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Their name"
                        required
                      />
                    </FormGroup>
                    <ButtonRow>
                      <Button 
                        type="submit" 
                        $variant="primary" 
                        disabled={loading || partnerPhone.length < 10 || !partnerName.trim()}
                        style={{ flex: 1 }}
                      >
                        {loading ? 'Registering...' : 'Complete Registration'}
                      </Button>
                    </ButtonRow>
                  </>
                )}
                
                <Button 
                  type="button" 
                  onClick={handleSkipPartner}
                  disabled={loading}
                >
                  Skip - Find a partner later
                </Button>
              </Form>
            </>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <>
              <SuccessMessage style={{ marginBottom: '1rem' }}>
                You&apos;re registered! Redirecting...
              </SuccessMessage>
              <StepTitle>You&apos;re in!</StepTitle>
              <StepDescription>
                {game?.isTeamGame 
                  ? `Your team "${teamName}" has been registered for ${tournament.name}.`
                  : `You've been registered for ${tournament.name}.`
                }
              </StepDescription>
            </>
          )}
        </ModalBody>
      </Modal>
    </Overlay>
  );
}
