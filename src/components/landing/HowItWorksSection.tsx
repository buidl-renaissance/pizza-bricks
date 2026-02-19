import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { HOW_IT_WORKS } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 2rem;
  text-align: center;
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;
`;

const StepCard = styled(motion.div)`
  text-align: center;
  padding: 1.5rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const StepIcon = styled.span`
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
`;

const StepTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const StepBody = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const ProgressWrap = styled(motion.div)`
  max-width: 400px;
  margin: 0 auto;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.5rem;
`;

const ProgressTrack = styled.div`
  height: 12px;
  background: ${({ theme }) => theme.borderSubtle};
  border-radius: 6px;
  overflow: hidden;
`;

const ProgressBar = styled(motion.div)`
  height: 100%;
  background: ${({ theme }) => theme.accent};
  border-radius: 6px;
`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export const HowItWorksSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <LandingSection id="how-it-works" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🧱 {HOW_IT_WORKS.title}
      </Title>
      <StepsGrid as={motion.div} variants={container} initial="hidden" animate={inView ? "show" : "hidden"}>
        {HOW_IT_WORKS.steps.map((step, i) => (
          <StepCard key={step.title} variants={item}>
            <StepIcon>{step.icon}</StepIcon>
            <StepTitle>{step.title}</StepTitle>
            <StepBody>{step.body}</StepBody>
          </StepCard>
        ))}
      </StepsGrid>
      <ProgressWrap
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <ProgressLabel>
          <span>0%</span>
          <span>Progress → shop materializes</span>
          <span>100%</span>
        </ProgressLabel>
        <ProgressTrack>
          <ProgressBar
            initial={{ width: "0%" }}
            animate={inView ? { width: "100%" } : { width: "0%" }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          />
        </ProgressTrack>
      </ProgressWrap>
    </LandingSection>
  );
};
