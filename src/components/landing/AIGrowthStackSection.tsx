import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { AI_GROWTH_STACK } from "@/content/landingCopy";

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
  margin: 0 0 2rem;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const Card = styled(motion.div)`
  padding: 1.5rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const CardIcon = styled.span`
  font-size: 1.5rem;
`;

const CardTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CardTagline = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 0.75rem;
  line-height: 1.5;
`;

const Think = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  font-style: italic;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 0.75rem;
  line-height: 1.5;
`;

const BulletList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BulletItem = styled.li`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.35rem;
  padding-left: 1rem;
  position: relative;
  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: ${({ theme }) => theme.accent};
  }
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

export const AIGrowthStackSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="ai-growth-stack">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {AI_GROWTH_STACK.title}
      </Title>
      <Subtitle
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {AI_GROWTH_STACK.subtitle}
      </Subtitle>
      <CardsGrid
        as={motion.div}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {AI_GROWTH_STACK.agents.map((agent) => (
          <Card key={agent.id} variants={item}>
            <CardHeader>
              <CardIcon>{agent.icon}</CardIcon>
              <CardTitle>{agent.title}</CardTitle>
            </CardHeader>
            <CardTagline>{agent.tagline}</CardTagline>
            <Think>Think: {agent.think}</Think>
            <BulletList>
              {agent.bullets.map((b, i) => (
                <BulletItem key={i}>{b}</BulletItem>
              ))}
            </BulletList>
          </Card>
        ))}
      </CardsGrid>
    </LandingSection>
  );
};
