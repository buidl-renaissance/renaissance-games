import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styled, { keyframes, css } from "styled-components";

// App configuration
const APP_NAME = "Into the Void";

export const getServerSideProps = async () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.builddetroit.xyz';
  
  return {
    props: {
      metadata: {
        title: `${APP_NAME} - Renaissance City Games`,
        description: "In-person tournaments. Real stakes. Pool, Chess, Euchre.",
        openGraph: {
          title: `${APP_NAME} - Renaissance City Games`,
          description: "In-person tournaments. Real stakes. Pool, Chess, Euchre.",
          images: [
            {
              url: "/thumbnail.jpg",
              width: 1200,
              height: 630,
              alt: APP_NAME,
            },
          ],
        },
        additionalMetaTags: [
          {
            name: 'fc:meta',
            content: JSON.stringify({
              slug: 'renaissance-city',
              title: APP_NAME,
              icon: `${appUrl}/thumbnail.jpg`,
            }),
          },
        ],
      },
    },
  };
};

// Animations
const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const subtleGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(123, 92, 255, 0); }
  50% { box-shadow: 0 0 32px rgba(123, 92, 255, 0.3); }
`;

// Styled Components
const ThresholdContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  position: relative;
  overflow: hidden;
  
  /* Void Black with subtle radial gradient */
  background: 
    radial-gradient(ellipse at 50% 0%, rgba(22, 24, 28, 0.6) 0%, transparent 60%),
    #0B0B0D;
  
  /* Subtle grain texture overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    z-index: 0;
  }
`;

const Content = styled.div<{ $visible: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  max-width: 400px;
  width: 100%;
  position: relative;
  z-index: 1;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.1s;
`;

const HeroSection = styled.section`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const Headline = styled.h1<{ $delay: number }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(3rem, 12vw, 5rem);
  font-weight: 700;
  color: ${({ theme }) => theme.signalWhite};
  letter-spacing: -0.04em;
  line-height: 0.9;
  margin: 0;
  animation: ${fadeUp} 0.8s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const Subheadline = styled.p<{ $delay: number }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textMuted};
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin: 0.5rem 0 0;
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const Microline = styled.p<{ $delay: number }>`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0.75rem 0 0;
  opacity: 0.7;
  animation: ${fadeIn} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const TournamentSection = styled.section<{ $delay: number }>`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const TournamentItem = styled.div<{ $delay: number }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.5s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const TournamentIcon = styled.span`
  font-size: 1.25rem;
  opacity: 0.4;
  width: 2rem;
  text-align: center;
  filter: grayscale(100%);
`;

const TournamentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const TournamentName = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  letter-spacing: -0.01em;
`;

const TournamentLabel = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const CTASection = styled.section<{ $delay: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  animation: ${fadeUp} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const EnterButton = styled(Link)<{ $active: boolean }>`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 1.125rem 3rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.signalWhite};
  text-decoration: none;
  border-radius: 2px;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 320px;
  text-align: center;
  
  ${({ $active }) => !$active && css`
    pointer-events: none;
    opacity: 0.5;
  `}
  
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    animation: ${subtleGlow} 2s ease-in-out infinite;
    color: ${({ theme }) => theme.signalWhite};
  }
  
  @media (max-width: 480px) {
    width: 100%;
    max-width: none;
  }
`;

const CTAMicrocopy = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  opacity: 0.5;
  margin: 0;
`;

const InscriptionRow = styled.footer<{ $delay: number }>`
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  animation: ${fadeIn} 0.6s ease-out both;
  animation-delay: ${({ $delay }) => $delay}ms;
  
  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const Inscription = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.15em;
  opacity: 0.4;
`;

const Divider = styled.span`
  width: 1px;
  height: 12px;
  background: ${({ theme }) => theme.border};
  opacity: 0.3;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const HomePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [ctaActive, setCtaActive] = useState(false);

  // Intentional 300ms pause before anything appears
  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    // CTA becomes active last (after all animations)
    const ctaTimer = setTimeout(() => {
      setCtaActive(true);
    }, 2000);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(ctaTimer);
    };
  }, []);

  // Animation delays (in ms, after the initial 300ms pause)
  const delays = {
    headline: 0,
    subheadline: 200,
    microline: 400,
    tournaments: 600,
    pool: 700,
    chess: 850,
    euchre: 1000,
    cta: 1200,
    inscriptions: 1500,
  };

  return (
    <>
      <Head>
        <title>Into the Void — Renaissance City Games</title>
        <meta name="description" content="In-person tournaments. Real stakes. Pool, Chess, Euchre." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ThresholdContainer>
        <Content $visible={isVisible}>
          <HeroSection>
            <Headline $delay={delays.headline}>INTO THE VOID</Headline>
            <Subheadline $delay={delays.subheadline}>Renaissance City Games</Subheadline>
            <Microline $delay={delays.microline}>In-person tournaments. Real stakes.</Microline>
          </HeroSection>

          <TournamentSection $delay={delays.tournaments}>
            <TournamentItem $delay={delays.pool}>
              <TournamentIcon>○</TournamentIcon>
              <TournamentInfo>
                <TournamentName>Break Into the Void</TournamentName>
                <TournamentLabel>Pool Tournament</TournamentLabel>
              </TournamentInfo>
            </TournamentItem>

            <TournamentItem $delay={delays.chess}>
              <TournamentIcon>◇</TournamentIcon>
              <TournamentInfo>
                <TournamentName>Endgame: Into the Void</TournamentName>
                <TournamentLabel>Chess Tournament</TournamentLabel>
              </TournamentInfo>
            </TournamentItem>

            <TournamentItem $delay={delays.euchre}>
              <TournamentIcon>⬡</TournamentIcon>
              <TournamentInfo>
                <TournamentName>Deal Into the Void</TournamentName>
                <TournamentLabel>Euchre Tournament</TournamentLabel>
              </TournamentInfo>
            </TournamentItem>
          </TournamentSection>

          <CTASection $delay={delays.cta}>
            <EnterButton href="/play" $active={ctaActive}>
              Enter the Void
            </EnterButton>
            <CTAMicrocopy>Registration opens inside</CTAMicrocopy>
          </CTASection>

          <InscriptionRow $delay={delays.inscriptions}>
            <Inscription>In-person only</Inscription>
            <Divider />
            <Inscription>Limited seats</Inscription>
            <Divider />
            <Inscription>Winners rewarded</Inscription>
          </InscriptionRow>
        </Content>
      </ThresholdContainer>
    </>
  );
};

export default HomePage;
