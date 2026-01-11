import React from 'react';
import styled, { keyframes } from 'styled-components';

interface PaymentPlaceholderProps {
  entryFee?: number | null;
  prizePool?: number | null;
  prizeDistribution?: Record<string, number> | null;
  participantCount?: number;
  maxParticipants?: number;
}

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const Container = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent}15, ${({ theme }) => theme.accentGold}15);
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ComingSoonBadge = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: ${({ theme }) => theme.accentGold}30;
  color: ${({ theme }) => theme.accentGold};
`;

const Content = styled.div`
  padding: 1.25rem;
`;

const PrizeSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PrizeAmount = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2rem;
  font-weight: 700;
  color: #22c55e;
  margin-bottom: 0.25rem;
`;

const PrizeLabel = styled.div`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  padding: 0.75rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const DistributionTable = styled.div`
  margin-bottom: 1.5rem;
`;

const DistributionTitle = styled.h4`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.75rem;
`;

const DistributionRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const PlacementLabel = styled.span`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PlacementIcon = styled.span<{ $place: number }>`
  font-size: 1rem;
`;

const PrizeValue = styled.span`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const PlaceholderButton = styled.button`
  width: 100%;
  padding: 1rem;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textSecondary};
  border: 2px dashed ${({ theme }) => theme.border};
  border-radius: 8px;
  cursor: not-allowed;
  position: relative;
  overflow: hidden;
  
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
      ${({ theme }) => theme.surface}40,
      transparent
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite;
  }
`;

const DisabledNote = styled.p`
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin-top: 0.75rem;
  font-style: italic;
`;

const formatCurrency = (cents: number | null | undefined): string => {
  if (!cents) return '$0';
  return `$${(cents / 100).toFixed(0)}`;
};

const getPlacementIcon = (place: number): string => {
  switch (place) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${place}`;
  }
};

const getPlacementLabel = (place: number): string => {
  switch (place) {
    case 1: return '1st Place';
    case 2: return '2nd Place';
    case 3: return '3rd Place';
    default: return `${place}th Place`;
  }
};

const DEFAULT_DISTRIBUTION: Record<string, number> = {
  '1': 70,
  '2': 20,
  '3': 10,
};

export const PaymentPlaceholder: React.FC<PaymentPlaceholderProps> = ({
  entryFee,
  prizePool,
  prizeDistribution,
  participantCount = 0,
  maxParticipants = 0,
}) => {
  const distribution = prizeDistribution || DEFAULT_DISTRIBUTION;
  const hasPrizes = prizePool && prizePool > 0;
  const hasEntryFee = entryFee && entryFee > 0;
  const potentialPool = hasEntryFee && !hasPrizes 
    ? entryFee * participantCount 
    : prizePool;

  const calculatePrize = (percentage: number): number => {
    if (!potentialPool) return 0;
    return Math.floor((potentialPool * percentage) / 100);
  };

  return (
    <Container>
      <Header>
        <Title>
          💰 Prize Pool
        </Title>
        <ComingSoonBadge>Coming Soon</ComingSoonBadge>
      </Header>

      <Content>
        {hasPrizes && (
          <PrizeSection>
            <PrizeAmount>{formatCurrency(prizePool)}</PrizeAmount>
            <PrizeLabel>Total Prize Pool</PrizeLabel>
          </PrizeSection>
        )}

        <InfoGrid>
          <InfoItem>
            <InfoLabel>Entry Fee</InfoLabel>
            <InfoValue>
              {hasEntryFee ? formatCurrency(entryFee) : 'Free'}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Participants</InfoLabel>
            <InfoValue>
              {participantCount}/{maxParticipants}
            </InfoValue>
          </InfoItem>
        </InfoGrid>

        {(hasPrizes || hasEntryFee) && (
          <DistributionTable>
            <DistributionTitle>Prize Distribution</DistributionTitle>
            {Object.entries(distribution)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([place, percentage]) => {
                const placeNum = parseInt(place);
                return (
                  <DistributionRow key={place}>
                    <PlacementLabel>
                      <PlacementIcon $place={placeNum}>
                        {getPlacementIcon(placeNum)}
                      </PlacementIcon>
                      {getPlacementLabel(placeNum)}
                    </PlacementLabel>
                    <PrizeValue>
                      {formatCurrency(calculatePrize(percentage))} ({percentage}%)
                    </PrizeValue>
                  </DistributionRow>
                );
              })}
          </DistributionTable>
        )}

        <PlaceholderButton disabled>
          {hasEntryFee ? `Pay ${formatCurrency(entryFee)} Entry Fee` : 'No Entry Fee Required'}
        </PlaceholderButton>
        
        <DisabledNote>
          Payment processing coming soon. Entry fees shown for informational purposes only.
        </DisabledNote>
      </Content>
    </Container>
  );
};

export default PaymentPlaceholder;
