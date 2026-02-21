import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { WHAT_IS_PB } from "@/content/landingCopy";

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
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
`;

const StagesLabel = styled(motion.p)`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
  text-align: center;
`;

const StagesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StageCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const StageIcon = styled.span`
  font-size: 1.25rem;
`;

const SupportLabel = styled(motion.p)`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
  text-align: center;
`;

const SupportList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 480px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
`;

const SupportItem = styled(motion.li)`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  padding-left: 1.25rem;
  position: relative;
  &::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: ${({ theme }) => theme.success};
    font-weight: 700;
  }
`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export const WhatIsPizzaBricksSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="what-is-pizza-bricks" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {WHAT_IS_PB.title}
      </Title>
      <Subtitle
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {WHAT_IS_PB.subtitle}
      </Subtitle>
      <StagesLabel
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {WHAT_IS_PB.stagesLabel}
      </StagesLabel>
      <StagesRow
        as={motion.div}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {WHAT_IS_PB.stages.map((stage, i) => (
          <StageCard key={stage.label} variants={item}>
            <StageIcon>{stage.icon}</StageIcon>
            {stage.label}
          </StageCard>
        ))}
      </StagesRow>
      <SupportLabel
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {WHAT_IS_PB.supportLabel}
      </SupportLabel>
      <SupportList
        as={motion.ul}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {WHAT_IS_PB.supportItems.map((s, i) => (
          <SupportItem key={i} variants={item}>
            {s}
          </SupportItem>
        ))}
      </SupportList>
    </LandingSection>
  );
};
