import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { APPLY_AS_BUSINESS } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
  text-align: center;
`;

const Subtitle = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: clamp(1rem, 2vw, 1.15rem);
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin: 0 0 1.5rem;
`;

const CtaWrap = styled(motion.div)`
  text-align: center;
`;

const CtaButton = styled.a`
  display: inline-block;
  padding: 0.875rem 1.75rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

export const ApplyAsBusinessSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const scrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(APPLY_AS_BUSINESS.id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingSection id="apply-as-business">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🍕 {APPLY_AS_BUSINESS.title}
      </Title>
      <Subtitle
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {APPLY_AS_BUSINESS.subtitle}
      </Subtitle>
      <CtaWrap
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CtaButton href={`#${APPLY_AS_BUSINESS.id}`} onClick={scrollToForm}>
          {APPLY_AS_BUSINESS.cta}
        </CtaButton>
      </CtaWrap>
    </LandingSection>
  );
};
