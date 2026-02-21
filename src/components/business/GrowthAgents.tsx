import React from "react";
import styled from "styled-components";
import { GROWTH_AGENTS } from "@/content/businessCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.text};
  position: relative;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const Label = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.accent};
  margin: 0 0 1rem;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: rgba(253, 248, 243, 0.65);
  max-width: 42rem;
  margin: 0 auto;
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  padding: 2rem;
  background: rgba(253, 248, 243, 0.06);
  border: 1px solid rgba(253, 248, 243, 0.12);
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: rgba(253, 248, 243, 0.1);
    transform: translateY(-4px);
  }
`;

const CardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 0.75rem;
`;

const CardDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(253, 248, 243, 0.55);
  line-height: 1.6;
  margin: 0 0 1.5rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(253, 248, 243, 0.75);
  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.accent};
    flex-shrink: 0;
  }
`;

export const GrowthAgents: React.FC = () => {
  return (
    <Section id="agents">
      <Container>
        <Header>
          <Label>{GROWTH_AGENTS.label}</Label>
          <Title>{GROWTH_AGENTS.title}</Title>
          <Subtitle>{GROWTH_AGENTS.subtitle}</Subtitle>
        </Header>
        <Grid>
          {GROWTH_AGENTS.agents.map((agent) => (
            <Card key={agent.title}>
              <CardIcon>{agent.icon}</CardIcon>
              <CardTitle>{agent.title}</CardTitle>
              <CardDescription>{agent.description}</CardDescription>
              <FeatureList>
                {agent.features.map((f) => (
                  <FeatureItem key={f}>{f}</FeatureItem>
                ))}
              </FeatureList>
            </Card>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};
