import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { POD_HOW_IT_WORKS } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
  text-align: center;
`;

const Subtitle = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin: 0 0 1.5rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
`;

const HowLabel = styled(motion.p)`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
  text-align: center;
`;

const StepsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto 2rem;
  max-width: 420px;
`;

const StepItem = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  &:last-child {
    border-bottom: none;
  }
`;

const StepIcon = styled.span`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const ContrastWrap = styled(motion.div)`
  text-align: center;
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
  max-width: 480px;
  margin: 0 auto;
`;

const InsteadOf = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 0.25rem;
`;

const InsteadOfLabel = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
`;

const WeGet = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 0.25rem;
`;

const WeGetLabel = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  margin: 0;
`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export const PodHowItWorksSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="community-pod" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {POD_HOW_IT_WORKS.title}
      </Title>
      <Subtitle
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {POD_HOW_IT_WORKS.subtitle}
      </Subtitle>
      <HowLabel
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {POD_HOW_IT_WORKS.howItWorksLabel}
      </HowLabel>
      <StepsList
        as={motion.ul}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {POD_HOW_IT_WORKS.steps.map((step, i) => (
          <StepItem key={i} variants={item}>
            <StepIcon>{step.icon}</StepIcon>
            {step.label}
          </StepItem>
        ))}
      </StepsList>
      <ContrastWrap
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <InsteadOf>{POD_HOW_IT_WORKS.insteadOf}</InsteadOf>
        <InsteadOfLabel>{POD_HOW_IT_WORKS.insteadOfLabel}</InsteadOfLabel>
        <WeGet>{POD_HOW_IT_WORKS.weGet}</WeGet>
        <WeGetLabel>{POD_HOW_IT_WORKS.weGetLabel}</WeGetLabel>
      </ContrastWrap>
    </LandingSection>
  );
};
