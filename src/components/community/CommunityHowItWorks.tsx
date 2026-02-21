import React from "react";
import styled, { keyframes } from "styled-components";
import { COMMUNITY_HOW_IT_WORKS } from "@/content/communityCopy";

const progressFill = keyframes`
  from { width: 0%; }
  to { width: 68%; }
`;

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.text};
  position: relative;
  overflow: hidden;
`;

const BgTexture = styled.div`
  position: absolute;
  inset: 0;
  background-image: url("/brick-texture.png");
  background-repeat: repeat;
  opacity: 0.12;
  pointer-events: none;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const Label = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: rgba(255, 225, 53, 0.15);
  color: ${({ theme }) => theme.accentGold};
  font-size: 0.875rem;
  font-weight: 800;
  font-family: "Righteous", cursive;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-family: "Righteous", cursive;
  font-weight: 900;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.signalWhite};
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 4rem;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StepCard = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StepIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const StepNumber = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-family: "Righteous", cursive;
  font-weight: 900;
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.2);
  user-select: none;
`;

const StepTitle = styled.h3`
  font-family: "Righteous", cursive;
  font-weight: 800;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 0.75rem;
`;

const StepDescription = styled.p`
  font-family: "Righteous", cursive;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
`;

const ProgressBox = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 2rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ProgressLabel = styled.span`
  font-family: "Righteous", cursive;
  font-weight: 700;
  color: ${({ theme }) => theme.signalWhite};
`;

const ProgressPercent = styled.span`
  font-family: "Righteous", cursive;
  font-weight: 800;
  color: ${({ theme }) => theme.accentGold};
`;

const ProgressTrack = styled.div`
  height: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: 0;
  border-radius: 9999px;
  background: linear-gradient(90deg, ${({ theme }) => theme.accentGold}, ${({ theme }) => theme.accent});
  animation: ${progressFill} 2s ease-out 0.5s forwards;
`;

const ProgressFooter = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-family: "Righteous", cursive;
  color: rgba(255, 255, 255, 0.5);
  span:last-of-type {
    color: ${({ theme }) => theme.accentGold};
    font-weight: 600;
  }
`;

export const CommunityHowItWorks: React.FC = () => {
  const c = COMMUNITY_HOW_IT_WORKS;
  return (
    <Section id="how">
      <BgTexture />
      <Container>
        <Header>
          <Label>{c.label}</Label>
          <Title>{c.title}</Title>
        </Header>
        <Grid>
          {c.steps.map((step) => (
            <StepCard key={step.number}>
              <StepNumber>{step.number}</StepNumber>
              <StepIcon>{step.icon}</StepIcon>
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
            </StepCard>
          ))}
        </Grid>
        <ProgressBox>
          <ProgressFooter style={{ marginBottom: "0.75rem" }}>
            <ProgressLabel>{c.progressStart}</ProgressLabel>
            <ProgressLabel>{c.progressEnd}</ProgressLabel>
          </ProgressFooter>
          <ProgressTrack>
            <ProgressBar />
          </ProgressTrack>
        </ProgressBox>
      </Container>
    </Section>
  );
};
