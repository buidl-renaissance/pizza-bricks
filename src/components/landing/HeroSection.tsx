import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  TAGLINE,
  SUBHEAD,
  HERO_CTA_POD,
  HERO_CTA_BUSINESS,
} from "@/content/landingCopy";

const Section = styled.section`
  min-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  position: relative;
`;

const VisualWrap = styled.div`
  position: relative;
  width: 200px;
  height: 140px;
  margin-bottom: 2rem;
`;

const PizzaSliceSvg = styled(motion.svg)`
  position: absolute;
  left: 50%;
  top: 20%;
  transform: translate(-50%, 0);
`;

const BrickSvg = styled(motion.svg)`
  position: absolute;
  right: 10%;
  bottom: 10%;
`;

const Headline = styled(motion.h1)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2.25rem, 6vw, 3.5rem);
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.1;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
`;

const Subheadline = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 2rem;
  max-width: 420px;
`;

const CtaRow = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
`;

const SecondaryLinks = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const SecondaryLink = styled(Link)`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const CtaButton = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: transform 0.2s;
  ${({ $primary, theme }) =>
    $primary
      ? `
    background: ${theme.accent};
    color: ${theme.onAccent ?? theme.signalWhite};
    &:hover { background: ${theme.accentHover}; }
  `
      : `
    background: ${theme.surface};
    color: ${theme.text};
    border: 2px solid ${theme.border};
    &:hover { border-color: ${theme.accent}; color: ${theme.accent}; }
  `}
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

export const HeroSection: React.FC = () => {
  return (
    <Section>
      <VisualWrap>
        <PizzaSliceSvg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          initial={{ opacity: 0, y: 20, rotate: -15 }}
          animate={{ opacity: 1, y: 0, rotate: -8 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <path
            d="M12 2L2 22l4-6 6 4 8-14L12 2z"
            fill="#E8B84C"
            stroke="#2D1F1A"
            strokeWidth="0.5"
          />
        </PizzaSliceSvg>
        <BrickSvg
          width="64"
          height="36"
          viewBox="0 0 64 36"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <rect
            x="2"
            y="2"
            width="60"
            height="32"
            rx="2"
            fill="#C41E3A"
            stroke="#2D1F1A"
            strokeWidth="1"
          />
          <rect x="8" y="8" width="12" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
        </BrickSvg>
      </VisualWrap>
      <Headline
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {TAGLINE}
      </Headline>
      <Subheadline
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        {SUBHEAD}
      </Subheadline>
      <CtaRow
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <CtaButton href="#join-pod" $primary>
          🧱 {HERO_CTA_POD}
        </CtaButton>
        <CtaButton href="#pizzeria-form">
          🍕 {HERO_CTA_BUSINESS}
        </CtaButton>
      </CtaRow>
      <SecondaryLinks
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <SecondaryLink href="/business">For Business →</SecondaryLink>
        <SecondaryLink href="/community">Community / Game →</SecondaryLink>
      </SecondaryLinks>
    </Section>
  );
};
