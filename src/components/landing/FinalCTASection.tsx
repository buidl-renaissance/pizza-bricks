import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { FINAL_CTA } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
  text-align: center;
`;

const ButtonRow = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-items: center;
`;

const CtaButton = styled.a<{ $primary?: boolean }>`
  display: inline-block;
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

export const FinalCTASection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingSection id="final-cta" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {FINAL_CTA.title}
      </Title>
      <ButtonRow
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CtaButton href="#pizzeria-form" $primary onClick={(e) => scrollToId(e, "pizzeria-form")}>
          {FINAL_CTA.buttons[0].label}
        </CtaButton>
        <CtaButton href="#join-pod" onClick={(e) => scrollToId(e, "join-pod")}>
          {FINAL_CTA.buttons[1].label}
        </CtaButton>
        <CtaButton href="#growth-partner" onClick={(e) => scrollToId(e, "growth-partner")}>
          {FINAL_CTA.buttons[2].label}
        </CtaButton>
      </ButtonRow>
    </LandingSection>
  );
};
