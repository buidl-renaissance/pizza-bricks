import React from "react";
import styled from "styled-components";
import { BUSINESS_HOW_IT_WORKS } from "@/content/businessCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.backgroundAlt};
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
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  max-width: 36rem;
  margin: 0 auto;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StepCard = styled.div`
  position: relative;
  padding: 2rem;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StepIcon = styled.span`
  font-size: 1.875rem;
`;

const StepNumber = styled.span`
  font-size: 0.75rem;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.textMuted};
`;

const StepTitle = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0;
`;

const StepBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.accentMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.accent};
`;

export const BusinessHowItWorks: React.FC = () => {
  const { label, title, subtitle, steps } = BUSINESS_HOW_IT_WORKS;
  return (
    <Section id="how">
      <Container>
        <Header>
          <Label>{label}</Label>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </Header>
        <Grid>
          {steps.map((step) => (
            <StepCard key={step.number}>
              <StepHeader>
                <StepIcon>{step.icon}</StepIcon>
                <StepNumber>STEP {step.number}</StepNumber>
              </StepHeader>
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
              <StepBadge>{step.number}</StepBadge>
            </StepCard>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};
