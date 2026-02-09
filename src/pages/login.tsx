import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import styled, { keyframes } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { useUser } from '@/contexts/UserContext';

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(123, 92, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(123, 92, 255, 0.5);
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(123, 92, 255, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 80% 20%, rgba(123, 92, 255, 0.03) 0%, transparent 40%);
    pointer-events: none;
  }
`;

const FormCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 2.5rem;
  max-width: 400px;
  width: 100%;
  position: relative;
  z-index: 1;
  animation: ${pulseGlow} 4s ease-in-out infinite;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 0.875rem 1rem;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 10px ${({ theme }) => theme.accentGlow};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  background: ${({ theme, $loading }) => $loading ? theme.border : theme.accent};
  border: none;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.background};
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  transition: all 0.2s;
  margin-top: 0.5rem;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 4px 20px ${({ theme }) => theme.accentGlow};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${({ theme }) => theme.danger};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.danger};
`;

const LockedMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${({ theme }) => theme.danger};
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
`;

const LockedTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.danger};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const LockedText = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 1rem;
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const PhoneDisplay = styled.div`
  background: ${({ theme }) => theme.accentMuted};
  border: 1px solid ${({ theme }) => theme.accent}40;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  font-size: 16px;
  color: ${({ theme }) => theme.accent};
  margin-bottom: 0.5rem;
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  margin-bottom: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.accent};
  border-radius: 50%;
  animation: ${rotate} 0.8s linear infinite;
  margin-bottom: 1rem;
`;

const StatusText = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

const PulsingDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  background: ${({ theme }) => theme.accent};
  border-radius: 50%;
  margin-right: 0.5rem;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const TimerText = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.75rem;
  margin-bottom: 0;
`;

const RefreshButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const DesktopOnlySection = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileSection = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.85rem;
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.border};
  }
`;

const MobileAppButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.5rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.background};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
`;

const SecondaryButton = styled.button`
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const LinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const StyledLink = styled(Link)`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const GuestLink = styled(Link)`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.textSecondary};
  }
`;

// Format phone number as user types: (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX
const formatPhoneNumber = (value: string): string => {
  // Strip all non-digit characters except leading +
  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return hasPlus ? '+' : '';
  
  // Handle +1 or 1 prefix (US country code)
  let formatted = '';
  let digitIndex = 0;
  
  if (hasPlus || digits.startsWith('1')) {
    // International format: +1 (XXX) XXX-XXXX
    if (digits.startsWith('1')) {
      formatted = '+1 ';
      digitIndex = 1;
    } else {
      formatted = '+';
    }
  }
  
  const remaining = digits.slice(digitIndex);
  
  if (remaining.length === 0) return formatted.trim();
  
  // Format remaining digits as (XXX) XXX-XXXX
  if (remaining.length <= 3) {
    formatted += `(${remaining}`;
  } else if (remaining.length <= 6) {
    formatted += `(${remaining.slice(0, 3)}) ${remaining.slice(3)}`;
  } else {
    formatted += `(${remaining.slice(0, 3)}) ${remaining.slice(3, 6)}-${remaining.slice(6, 10)}`;
  }
  
  return formatted;
};

const APP_DEEP_LINK = 'https://renaissance.app/open';

type LoginStep = 'method' | 'phone' | 'pin' | 'setPin' | 'locked';

export default function LoginPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const { user, isLoading: isUserLoading, refreshUser } = useUser();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('method');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 4 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 4 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(value);
  };

  // Get the redirect URL or default to dashboard
  const redirectUrl = typeof redirect === 'string' ? redirect : '/dashboard';

  // Get pending user data from localStorage (set by Renaissance app auth)
  const getPendingUserData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('renaissance_pending_user_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  // Clear pending user data after successful auth
  const clearPendingUserData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('renaissance_pending_user_data');
    }
  };

  const createSession = useCallback(async () => {
    if (isCreatingSession) return;
    setIsCreatingSession(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/session', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');
      setSessionToken(data.token);
      setSessionExpiresAt(data.expiresAt);
      setTimeRemaining(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  }, [isCreatingSession]);

  // URL format so device camera opens app; app POSTs to callbackUrl for auth (same as People)
  const getQRCodeData = useCallback(() => {
    if (!sessionToken || typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const callbackUrl = `${origin}/api/auth/qr-authenticate`;
    return `renaissance://authenticate?token=${encodeURIComponent(sessionToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}&appName=${encodeURIComponent('Games')}`;
  }, [sessionToken]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isUserLoading) return;
    if (user) {
      router.replace(redirectUrl);
      return;
    }
  }, [user, isUserLoading, router, redirectUrl]);

  useEffect(() => {
    if (step === 'method') createSession();
  }, [step]);

  useEffect(() => {
    if (step !== 'method' || !sessionToken || !sessionExpiresAt) return;
    const interval = setInterval(async () => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
      if (Date.now() >= sessionExpiresAt) {
        setSessionToken(null);
        setSessionExpiresAt(null);
        return;
      }
      try {
        const res = await fetch(`/api/auth/session?token=${sessionToken}`, { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.userId) {
          if (data.user) localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
          else localStorage.setItem('renaissance_app_user', JSON.stringify({ id: data.userId, username: data.username }));
          await refreshUser();
          window.location.href = redirectUrl;
        }
      } catch {
        // ignore
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step, sessionToken, sessionExpiresAt, redirectUrl, refreshUser]);

  const handleOpenApp = () => {
    if (sessionToken && typeof window !== 'undefined') {
      const callbackUrl = `${window.location.origin}/api/auth/qr-authenticate`;
      window.open(`renaissance://authenticate?token=${encodeURIComponent(sessionToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}&appName=${encodeURIComponent('Games')}`, '_blank');
    } else {
      window.open(APP_DEEP_LINK, '_blank');
    }
  };

  const handleBackToMethod = () => {
    setStep('method');
    setError('');
    setLoginError(null);
    setSessionToken(null);
    setSessionExpiresAt(null);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Normalize phone number
    const normalized = phone.replace(/[\s\-\(\)]/g, '');
    setNormalizedPhone(normalized);

    try {
      const pendingUserData = getPendingUserData();
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, pendingUserData }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.status === 404) {
        // Phone not found - redirect to register with phone pre-filled
        const registerUrl = `/register?phone=${encodeURIComponent(normalized)}&redirect=${encodeURIComponent(redirectUrl)}`;
        router.push(registerUrl);
        return;
      }

      if (res.status === 423) {
        // Account is locked
        setStep('locked');
        setLoading(false);
        return;
      }

      if (data.needsSetPin) {
        // User doesn't have a PIN - prompt them to set one
        setUserName(data.displayName || '');
        setStep('setPin');
        setLoading(false);
        return;
      }

      if (data.requiresPin) {
        // Move to PIN step
        setStep('pin');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store user in localStorage so UserContext picks it up on redirect
      if (data.user) {
        localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
      }

      // Success - use hard redirect to ensure fresh UserContext state
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const pendingUserData = getPendingUserData();
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, pin, pendingUserData }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.status === 423) {
        // Account is locked
        setStep('locked');
        setLoading(false);
        return;
      }

      if (res.status === 401) {
        // Invalid PIN
        setError(data.error || 'Invalid PIN');
        setPin('');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Clear pending data and store user
      clearPendingUserData();
      if (data.user) {
        localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
      }

      // Success - use hard redirect to ensure fresh UserContext state
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleSetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      const pendingUserData = getPendingUserData();
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, pin, pendingUserData }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to set PIN');
        setLoading(false);
        return;
      }

      // Clear pending data and store user
      clearPendingUserData();
      if (data.user) {
        localStorage.setItem('renaissance_app_user', JSON.stringify(data.user));
      }

      // Success - use hard redirect to ensure fresh UserContext state
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Set PIN error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setPin('');
    setConfirmPin('');
    setError('');
  };

  if (isUserLoading) return null;

  // Method step: QR code + Use phone
  if (step === 'method') {
    return (
      <>
        <NextSeo title="Sign In" description="Sign in to your Renaissance Games account" />
        <Container>
          <FormCard>
            <Title>Sign In</Title>
            <DesktopOnlySection>
              <Subtitle>Scan this QR code with the Renaissance app to sign in</Subtitle>
              {isCreatingSession ? (
                <>
                  <LoadingSpinner />
                  <StatusText>Creating session...</StatusText>
                </>
              ) : loginError ? (
                <>
                  <StatusText>{loginError}</StatusText>
                  <RefreshButton onClick={createSession} type="button">Try Again</RefreshButton>
                </>
              ) : sessionToken ? (
                <div style={{ textAlign: 'center' }}>
                  <QRCodeContainer>
                    <QRCodeSVG value={getQRCodeData()} size={200} level="M" includeMargin={false} />
                  </QRCodeContainer>
                  <StatusText>
                    <PulsingDot />
                    Waiting for authentication...
                  </StatusText>
                  {timeRemaining > 0 && (
                    <TimerText>Expires in {formatTime(timeRemaining)}</TimerText>
                  )}
                  {timeRemaining === 0 && (
                    <RefreshButton onClick={createSession} type="button">Refresh QR Code</RefreshButton>
                  )}
                </div>
              ) : null}
            </DesktopOnlySection>
            <MobileSection>
              <Subtitle>Open the Renaissance app to sign in to your account</Subtitle>
              <MobileAppButton as="button" type="button" onClick={handleOpenApp}>Open Renaissance App</MobileAppButton>
              <OrDivider>or</OrDivider>
              {sessionToken ? (
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <StatusText style={{ marginBottom: '0.5rem' }}>Show this QR code to another device</StatusText>
                  <QRCodeContainer>
                    <QRCodeSVG value={getQRCodeData()} size={160} level="M" includeMargin={false} />
                  </QRCodeContainer>
                  <StatusText><PulsingDot /> Waiting...</StatusText>
                </div>
              ) : null}
            </MobileSection>
            <OrDivider>or sign in with phone</OrDivider>
            <SecondaryButton type="button" onClick={() => setStep('phone')}>Use Phone Number</SecondaryButton>
            <LinksContainer>
              <StyledLink href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}>
                Create a new account
              </StyledLink>
              <GuestLink href="/dashboard">Continue as guest</GuestLink>
            </LinksContainer>
          </FormCard>
        </Container>
      </>
    );
  }

  // Locked account view
  if (step === 'locked') {
    return (
      <>
        <NextSeo title="Account Locked" noindex />
        <Container>
          <FormCard>
            <Title>Account Locked</Title>
            <LockedMessage>
              <LockedTitle>Too Many Failed Attempts</LockedTitle>
              <LockedText>
                Your account has been locked for security reasons. Please contact an administrator to unlock your account.
              </LockedText>
              <BackButton onClick={handleBackToMethod}>
                Try Different Method
              </BackButton>
            </LockedMessage>
          </FormCard>
        </Container>
      </>
    );
  }

  // Set PIN step (for users without a PIN)
  if (step === 'setPin') {
    return (
      <>
        <NextSeo title="Set PIN" noindex />
        <Container>
          <FormCard>
            <Title>Set Your PIN</Title>
            <Subtitle>
              {userName ? `Welcome back, ${userName}! ` : ''}
              Create a 4-digit PIN to secure your account
            </Subtitle>
            
            <Form onSubmit={handleSetPinSubmit}>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <FormGroup>
                <Label>Phone Number</Label>
                <PhoneDisplay>{phone}</PhoneDisplay>
                <BackButton type="button" onClick={handleBack}>
                  Change Number
                </BackButton>
              </FormGroup>
              
              <FormGroup>
                <Label>Create PIN</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="0000"
                  required
                  maxLength={4}
                  autoComplete="off"
                  autoFocus
                />
              </FormGroup>

              <FormGroup>
                <Label>Confirm PIN</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={handleConfirmPinChange}
                  placeholder="0000"
                  required
                  maxLength={4}
                  autoComplete="off"
                />
              </FormGroup>
              
              <SubmitButton 
                type="submit" 
                disabled={loading || pin.length !== 4 || confirmPin.length !== 4} 
                $loading={loading}
              >
                {loading ? 'Setting PIN...' : 'Set PIN & Sign In'}
              </SubmitButton>
            </Form>
          </FormCard>
        </Container>
      </>
    );
  }

  // PIN entry step
  if (step === 'pin') {
    return (
      <>
        <NextSeo title="Enter PIN" noindex />
        <Container>
          <FormCard>
            <Title>Enter PIN</Title>
            <Subtitle>Enter your 4-digit PIN to continue</Subtitle>
            
            <Form onSubmit={handlePinSubmit}>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <FormGroup>
                <Label>Phone Number</Label>
                <PhoneDisplay>{phone}</PhoneDisplay>
                <BackButton type="button" onClick={handleBack}>
                  Change Number
                </BackButton>
              </FormGroup>
              
              <FormGroup>
                <Label>PIN</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="0000"
                  required
                  maxLength={4}
                  autoComplete="off"
                  autoFocus
                />
              </FormGroup>
              
              <SubmitButton type="submit" disabled={loading || pin.length !== 4} $loading={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </SubmitButton>
            </Form>
          </FormCard>
        </Container>
      </>
    );
  }

  // Phone entry step
  return (
    <>
      <NextSeo
        title="Sign In"
        description="Sign in to your Renaissance Games account"
      />
      <Container>
        <FormCard>
          <Title>Sign In</Title>
          <Subtitle>Enter your phone number to continue</Subtitle>
          
          <Form onSubmit={handlePhoneSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <FormGroup>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+1 (555) 123-4567"
                required
                autoComplete="tel"
                autoFocus
              />
            </FormGroup>
            
            <SubmitButton type="submit" disabled={loading} $loading={loading}>
              {loading ? 'Checking...' : 'Continue'}
            </SubmitButton>
            <BackButton type="button" onClick={handleBackToMethod} style={{ marginTop: '1rem' }}>
              Back to sign-in options
            </BackButton>
          </Form>
        </FormCard>
      </Container>
    </>
  );
}
