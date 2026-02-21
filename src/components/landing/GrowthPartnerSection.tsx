import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { GROWTH_PARTNER } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
  text-align: center;
`;

const Subtitle = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: 1rem;
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
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  border: 2px solid ${({ theme }) => theme.border};
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: border-color 0.2s, color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

export const GrowthPartnerSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const scrollToJoinPod = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("join-pod")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingSection id={GROWTH_PARTNER.id}>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🤝 {GROWTH_PARTNER.title}
      </Title>
      <Subtitle
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {GROWTH_PARTNER.subtitle}
      </Subtitle>
      <CtaWrap
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CtaButton href="#join-pod" onClick={scrollToJoinPod}>
          Join a Pod
        </CtaButton>
      </CtaWrap>
    </LandingSection>
  );
};
