import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styled, { keyframes } from 'styled-components';

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(123, 92, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(123, 92, 255, 0.5);
  }
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

type LoginStep = 'phone' | 'pin' | 'setPin' | 'locked';

export default function LoginPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('phone');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [userName, setUserName] = useState('');

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

  // Locked account view
  if (step === 'locked') {
    return (
      <>
        <Head>
          <title>Account Locked | Renaissance Games</title>
          <meta name="description" content="Account locked" />
        </Head>
        <Container>
          <FormCard>
            <Title>Account Locked</Title>
            <LockedMessage>
              <LockedTitle>Too Many Failed Attempts</LockedTitle>
              <LockedText>
                Your account has been locked for security reasons. Please contact an administrator to unlock your account.
              </LockedText>
              <BackButton onClick={handleBack}>
                Try Different Number
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
        <Head>
          <title>Set PIN | Renaissance Games</title>
          <meta name="description" content="Set your PIN to secure your account" />
        </Head>
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
        <Head>
          <title>Enter PIN | Renaissance Games</title>
          <meta name="description" content="Enter your PIN to sign in" />
        </Head>
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

  // Phone entry step (default)
  return (
    <>
      <Head>
        <title>Sign In | Renaissance Games</title>
        <meta name="description" content="Sign in to your Renaissance Games account" />
      </Head>
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
          </Form>
        </FormCard>
      </Container>
    </>
  );
}
