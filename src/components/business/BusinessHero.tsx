import React from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { BUSINESS_HERO } from "@/content/businessCopy";

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const Section = styled.section`
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 6rem 1.5rem 4rem;
`;

const BgGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    ${({ theme }) => theme.accentMuted} 0%,
    rgba(196, 30, 58, 0.04) 100%
  );
`;

const BgBlur1 = styled.div`
  position: absolute;
  top: 5rem;
  right: 2.5rem;
  width: 18rem;
  height: 18rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  opacity: 0.05;
  filter: blur(48px);
`;

const BgBlur2 = styled.div`
  position: absolute;
  bottom: 2.5rem;
  left: 2.5rem;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.accent};
  opacity: 0.05;
  filter: blur(48px);
`;

const Container = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
`;

const Inner = styled.div`
  max-width: 48rem;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.accentMuted};
  border: 1px solid ${({ theme }) => theme.accent};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.accent};
  margin-bottom: 2rem;
`;

const Headline = styled.h1`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 600;
  line-height: 1.1;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
`;

const HeadlineAccent = styled.span`
  display: inline-block;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.accent} 25%,
    ${({ theme }) => theme.accentGold} 50%,
    ${({ theme }) => theme.accent} 75%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 3s linear infinite;
`;

const Subcopy = styled.p`
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: ${({ theme }) => theme.textSecondary};
  max-width: 42rem;
  margin: 0 0 1rem;
  line-height: 1.6;
`;

const SubcopySmall = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  max-width: 36rem;
  margin: 0 0 2.5rem;
  line-height: 1.5;
`;

const CtaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  background: ${({ theme }) => theme.accent};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  }
`;

const OutlineButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.text};
  background: transparent;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

export const BusinessHero: React.FC = () => {
  return (
    <Section>
      <BgGradient />
      <BgBlur1 />
      <BgBlur2 />
      <Container>
        <Inner>
          <Badge>
            <span>🍕🧱</span>
            <span>{BUSINESS_HERO.badge}</span>
          </Badge>
          <Headline>
            {BUSINESS_HERO.headline}
            <br />
            <HeadlineAccent>{BUSINESS_HERO.headlineAccent}</HeadlineAccent>
          </Headline>
          <Subcopy>{BUSINESS_HERO.subcopy}</Subcopy>
          <SubcopySmall>{BUSINESS_HERO.subcopySmall}</SubcopySmall>
          <CtaRow>
            <PrimaryButton href="/#join-pod">{BUSINESS_HERO.ctaPrimary}</PrimaryButton>
            <OutlineButton href="/#join-pod">{BUSINESS_HERO.ctaSecondary}</OutlineButton>
          </CtaRow>
        </Inner>
      </Container>
    </Section>
  );
};
