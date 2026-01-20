import React, { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled, { keyframes, css } from 'styled-components';
import { useUser } from '@/contexts/UserContext';
import { Loading } from '@/components/Loading';
import { UserHeader } from '@/components/UserHeader';
import { utcToEstInput, estInputToUtc } from '@/lib/timezone';

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
  imageUrl: string | null;
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

interface Organizer {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
  } | null;
}

interface UserSearchResult {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
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
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box;
  overflow-x: hidden;
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
  width: 100%;
  min-width: 0;
`;

const FormSection = styled.section`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  padding: 1rem;
  box-sizing: border-box;
  width: 100%;
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
  width: 100%;
  min-width: 0;
  
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
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.75rem 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
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
  font-size: 16px;
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
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.75rem 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  text-align-last: center;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.accentMuted};
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  
  /* Ensure children don't overflow */
  & > * {
    min-width: 0;
  }
`;

const DateTimeRow = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;
  
  & > input[type="date"] {
    flex: 1;
    min-width: 0;
  }
  
  & > select {
    flex: 1;
    min-width: 0;
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
  
  ${({ $loading, theme }) => $loading && css`
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

// Organizer management styles
const OrganizerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const OrganizerRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
`;

const OrganizerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const OrganizerName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const OrganizerUsername = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const OrganizerBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background: rgba(123, 92, 255, 0.15);
  color: ${({ theme }) => theme.accent};
  border-radius: 3px;
  text-transform: uppercase;
`;

const RemoveButton = styled.button`
  font-size: 0.75rem;
  padding: 0.375rem 0.625rem;
  background: transparent;
  color: ${({ theme }) => theme.danger};
  border: 1px solid ${({ theme }) => theme.danger};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddOrganizerRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddButton = styled.button`
  font-size: 0.85rem;
  padding: 0.625rem 1rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// User search autocomplete styles
const AutocompleteWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
`;

const AutocompleteItem = styled.button`
  width: 100%;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.backgroundAlt};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }
`;

const AutocompleteAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.backgroundAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
`;

const AutocompleteAvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AutocompleteAvatarInitial = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.textMuted};
`;

const AutocompleteInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const AutocompleteName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AutocompleteUsername = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const AutocompleteEmpty = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
`;

// Image upload styles
const ImageUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ImagePreview = styled.div`
  width: 100%;
  max-width: 300px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaceholderText = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
`;

const ImageActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const UploadButton = styled.label`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.625rem 1rem;
  background: ${({ theme }) => theme.accent};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
  
  input {
    display: none;
  }
`;

const RemoveImageButton = styled.button`
  font-size: 0.85rem;
  padding: 0.625rem 1rem;
  background: transparent;
  color: ${({ theme }) => theme.danger};
  border: 1px solid ${({ theme }) => theme.danger};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

const UploadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
  width: fit-content;
`;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Open',
  ready: 'Ready',
  in_progress: 'Live',
  completed: 'Done',
  cancelled: 'Void',
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Image upload state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Organizer state
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [primaryOrganizer, setPrimaryOrganizer] = useState<{ id: string; username: string | null; displayName: string | null } | null>(null);
  const [newOrganizerUsername, setNewOrganizerUsername] = useState('');
  const [isAddingOrganizer, setIsAddingOrganizer] = useState(false);

  // User search autocomplete state
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    startDate: '',
    startTime: '',
    registrationDate: '',
    registrationTime: '',
  });

  // Generate time options at 15-minute intervals
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours < 12 ? 'AM' : 'PM';
    const label = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    return { value, label };
  });

  // Combine date and time into datetime-local format
  const combineDateAndTime = (date: string, time: string): string | undefined => {
    if (!date) return undefined;
    if (!time) return `${date}T00:00`;
    return `${date}T${time}`;
  };

  // Split datetime-local into separate date and time
  const splitDateTimeLocal = (datetimeLocal: string): { date: string; time: string } => {
    if (!datetimeLocal) return { date: '', time: '' };
    const [date, time] = datetimeLocal.split('T');
    // Round time to nearest 15-minute interval for the select
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      const roundedMinutes = Math.round(minutes / 15) * 15;
      const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
      const finalHours = roundedMinutes === 60 ? hours + 1 : hours;
      return { 
        date, 
        time: `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}` 
      };
    }
    return { date, time: '' };
  };

  const isAdditionalOrganizer = organizers.some(o => o.userId === user?.id);
  const isOrganizer = user && tournament && (
    user.id === tournament.organizerId ||
    user.role === 'admin' ||
    isAdditionalOrganizer
  );

  // Search for users with debouncing
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle username input change with debounce
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewOrganizerUsername(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Select a user from the dropdown
  const selectUser = (user: UserSearchResult) => {
    setNewOrganizerUsername(user.username || '');
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        const startDateTime = t.startTime ? splitDateTimeLocal(formatDateTimeLocal(t.startTime)) : { date: '', time: '' };
        const regDateTime = t.registrationDeadline ? splitDateTimeLocal(formatDateTimeLocal(t.registrationDeadline)) : { date: '', time: '' };
        
        setFormData({
          name: t.name || '',
          description: t.description || '',
          minParticipants: String(t.minParticipants || ''),
          maxParticipants: String(t.maxParticipants || ''),
          entryFee: t.entryFee ? String(t.entryFee / 100) : '',
          prizePool: t.prizePool ? String(t.prizePool / 100) : '',
          bestOf: String(t.bestOf || 1),
          location: t.location || '',
          startDate: startDateTime.date,
          startTime: startDateTime.time,
          registrationDate: regDateTime.date,
          registrationTime: regDateTime.time,
        });
        
        // Set image URL from tournament data
        setImageUrl(t.imageUrl || null);
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

  // Fetch organizers
  const fetchOrganizers = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/tournaments/${id}/organizers`);
      if (res.ok) {
        const data = await res.json();
        setPrimaryOrganizer(data.primaryOrganizer);
        setOrganizers(data.additionalOrganizers || []);
      }
    } catch (error) {
      console.error('Error fetching organizers:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  const handleAddOrganizer = async () => {
    if (!newOrganizerUsername.trim() || !id) return;

    setIsAddingOrganizer(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/organizers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newOrganizerUsername.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add organizer');
      }

      setOrganizers(prev => [...prev, data.organizer]);
      setNewOrganizerUsername('');
      setMessage({ type: 'success', text: 'Organizer added successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add organizer' });
    } finally {
      setIsAddingOrganizer(false);
    }
  };

  const handleRemoveOrganizer = async (userId: string) => {
    if (!id) return;

    try {
      const res = await fetch(`/api/tournaments/${id}/organizers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove organizer');
      }

      setOrganizers(prev => prev.filter(o => o.userId !== userId));
      setMessage({ type: 'success', text: 'Organizer removed' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to remove organizer' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
      return;
    }

    setIsUploadingImage(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tournamentId', id as string);

      const res = await fetch('/api/tournaments/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setImageUrl(data.imageUrl);
      setMessage({ type: 'success', text: 'Image uploaded successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to upload image' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!id) return;
    
    setIsUploadingImage(true);
    try {
      // Update tournament to remove image URL
      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null }),
      });

      if (!res.ok) {
        throw new Error('Failed to remove image');
      }

      setImageUrl(null);
      setMessage({ type: 'success', text: 'Image removed' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to remove image' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const formatDateTimeLocal = (isoString: string) => {
    // Convert UTC to EST for display in the form
    return utcToEstInput(isoString);
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

      const startDateTime = combineDateAndTime(formData.startDate, formData.startTime);
      const regDateTime = combineDateAndTime(formData.registrationDate, formData.registrationTime);
      
      if (startDateTime) {
        body.startTime = estInputToUtc(startDateTime).toISOString();
      }
      if (regDateTime) {
        body.registrationDeadline = estInputToUtc(regDateTime).toISOString();
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
      setIsSaving(false);

      // Show loading state during redirect
      setIsRedirecting(true);
      setTimeout(() => {
        router.push(`/tournaments/${id}/admin`);
      }, 800);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update tournament' });
      setIsSaving(false);
    }
  };

  // Show loading for data fetch or during redirect after save
  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  if (isRedirecting) {
    return <Loading text="Saved! Redirecting..." />;
  }

  if (!tournament) {
    return (
      <Container>
        <UserHeader showBack backHref="/dashboard" />
        <Main>
          <Message $type="error">Tournament not found</Message>
        </Main>
      </Container>
    );
  }

  if (!isOrganizer) {
    return (
      <Container>
        <UserHeader showBack backHref={`/tournaments/${id}`} />
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

      <UserHeader showBack backHref={`/tournaments/${id}/admin`} />

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
                <SectionIcon>🖼</SectionIcon>
                <SectionTitle>Event Flyer</SectionTitle>
              </SectionHeader>

              <FormGroup>
                <Label>Tournament Image</Label>
                <ImageUploadContainer>
                  <ImagePreviewWrapper>
                    <ImagePreview>
                      {imageUrl ? (
                        <PreviewImage src={imageUrl} alt="Tournament flyer" />
                      ) : (
                        <PlaceholderText>No image uploaded</PlaceholderText>
                      )}
                    </ImagePreview>
                    {isUploadingImage && (
                      <UploadingOverlay>Uploading...</UploadingOverlay>
                    )}
                  </ImagePreviewWrapper>
                  <ImageActions>
                    <UploadButton>
                      {imageUrl ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                    </UploadButton>
                    {imageUrl && (
                      <RemoveImageButton
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isUploadingImage}
                      >
                        Remove
                      </RemoveImageButton>
                    )}
                  </ImageActions>
                </ImageUploadContainer>
                <HelpText>Upload a flyer or promotional image for your tournament (max 5MB, JPG/PNG/GIF/WebP)</HelpText>
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

              <FormGroup>
                <Label>Registration Deadline</Label>
                <DateTimeRow>
                  <Input
                    id="registrationDate"
                    name="registrationDate"
                    type="date"
                    value={formData.registrationDate}
                    onChange={handleChange}
                  />
                  <Select
                    id="registrationTime"
                    name="registrationTime"
                    value={formData.registrationTime}
                    onChange={handleChange}
                  >
                    <option value="">Select time...</option>
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </DateTimeRow>
              </FormGroup>

              <FormGroup>
                <Label>Start Date & Time</Label>
                <DateTimeRow>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  <Select
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  >
                    <option value="">Select time...</option>
                    {timeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </DateTimeRow>
              </FormGroup>
              <HelpText>All times are in Eastern Time (EST/EDT)</HelpText>
            </FormSection>

            <FormSection>
              <SectionHeader>
                <SectionIcon>👥</SectionIcon>
                <SectionTitle>Organizers</SectionTitle>
              </SectionHeader>

              <OrganizerList>
                {/* Primary Organizer */}
                {primaryOrganizer && (
                  <OrganizerRow>
                    <OrganizerInfo>
                      <OrganizerName>
                        {primaryOrganizer.displayName || primaryOrganizer.username || 'Unknown'}
                      </OrganizerName>
                      {primaryOrganizer.username && (
                        <OrganizerUsername>@{primaryOrganizer.username}</OrganizerUsername>
                      )}
                    </OrganizerInfo>
                    <OrganizerBadge>Owner</OrganizerBadge>
                  </OrganizerRow>
                )}

                {/* Additional Organizers */}
                {organizers.map((org) => (
                  <OrganizerRow key={org.id}>
                    <OrganizerInfo>
                      <OrganizerName>
                        {org.user?.displayName || org.user?.username || 'Unknown'}
                      </OrganizerName>
                      {org.user?.username && (
                        <OrganizerUsername>@{org.user.username}</OrganizerUsername>
                      )}
                    </OrganizerInfo>
                    {user?.id === tournament?.organizerId && (
                      <RemoveButton onClick={() => handleRemoveOrganizer(org.userId)}>
                        Remove
                      </RemoveButton>
                    )}
                  </OrganizerRow>
                ))}
              </OrganizerList>

              <FormGroup>
                <Label>Add Organizer</Label>
                <AddOrganizerRow>
                  <AutocompleteWrapper ref={dropdownRef}>
                    <Input
                      type="text"
                      placeholder="Search by username..."
                      value={newOrganizerUsername}
                      onChange={handleUsernameChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (searchResults.length > 0 && showDropdown) {
                            selectUser(searchResults[0]);
                          } else {
                            handleAddOrganizer();
                          }
                        }
                        if (e.key === 'Escape') {
                          setShowDropdown(false);
                        }
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowDropdown(true);
                        }
                      }}
                    />
                    {showDropdown && (
                      <AutocompleteDropdown>
                        {isSearching ? (
                          <AutocompleteEmpty>Searching...</AutocompleteEmpty>
                        ) : searchResults.length === 0 ? (
                          <AutocompleteEmpty>No users found</AutocompleteEmpty>
                        ) : (
                          searchResults.map((searchUser) => (
                            <AutocompleteItem
                              key={searchUser.id}
                              type="button"
                              onClick={() => selectUser(searchUser)}
                            >
                              <AutocompleteAvatar>
                                {searchUser.pfpUrl ? (
                                  <AutocompleteAvatarImg 
                                    src={searchUser.pfpUrl} 
                                    alt={searchUser.displayName || searchUser.username || ''} 
                                  />
                                ) : (
                                  <AutocompleteAvatarInitial>
                                    {(searchUser.displayName || searchUser.username || '?')[0].toUpperCase()}
                                  </AutocompleteAvatarInitial>
                                )}
                              </AutocompleteAvatar>
                              <AutocompleteInfo>
                                <AutocompleteName>
                                  {searchUser.displayName || searchUser.username || 'Unknown'}
                                </AutocompleteName>
                                {searchUser.username && (
                                  <AutocompleteUsername>@{searchUser.username}</AutocompleteUsername>
                                )}
                              </AutocompleteInfo>
                            </AutocompleteItem>
                          ))
                        )}
                      </AutocompleteDropdown>
                    )}
                  </AutocompleteWrapper>
                  <AddButton 
                    type="button"
                    onClick={handleAddOrganizer}
                    disabled={isAddingOrganizer || !newOrganizerUsername.trim()}
                  >
                    {isAddingOrganizer ? 'Adding...' : 'Add'}
                  </AddButton>
                </AddOrganizerRow>
                <HelpText>Search for users to add as tournament organizers.</HelpText>
              </FormGroup>
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
