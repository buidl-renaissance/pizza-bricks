import React from "react";
import styled from "styled-components";
import { COMMUNITY_POWERED_BY } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.text};
  position: relative;
  overflow: hidden;
`;

const BgGradient = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background: radial-gradient(circle at 30% 50%, ${({ theme }) => theme.accentGold} 0%, transparent 60%),
    radial-gradient(circle at 70% 50%, ${({ theme }) => theme.accent} 0%, transparent 60%);
  pointer-events: none;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4rem;
  align-items: center;
  @media (min-width: 1024px) {
    flex-direction: row;
    gap: 4rem;
  }
`;

const Left = styled.div`
  flex: 1;
  text-align: center;
  @media (min-width: 1024px) {
    text-align: left;
  }
`;

const Label = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: rgba(253, 248, 243, 0.15);
  color: ${({ theme }) => theme.accentGold};
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 1.5rem;
`;

const Body = styled.p`
  font-size: 1.125rem;
  color: rgba(253, 248, 243, 0.65);
  line-height: 1.6;
  margin: 0 0 1rem;
  max-width: 32rem;
  @media (min-width: 1024px) {
    margin-left: 0;
  }
  margin-left: auto;
  margin-right: auto;
`;

const LearnMoreBtn = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.signalWhite};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
`;

const Right = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const FeatureCard = styled.div`
  background: rgba(253, 248, 243, 0.06);
  border: 1px solid rgba(253, 248, 243, 0.12);
  border-radius: 16px;
  padding: 1.5rem;
  transition: background 0.2s;
  &:hover {
    background: rgba(253, 248, 243, 0.1);
  }
`;

const FeatureIcon = styled.div`
  font-size: 1.875rem;
  margin-bottom: 0.75rem;
`;

const FeatureTitle = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 0.5rem;
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(253, 248, 243, 0.55);
  margin: 0;
`;

export const CommunityPoweredBy: React.FC = () => {
  const c = COMMUNITY_POWERED_BY;
  return (
    <Section>
      <BgGradient />
      <Container>
        <Flex>
          <Left>
            <Label>{c.label}</Label>
            <Title>{c.title}</Title>
            <Body>{c.body}</Body>
            {c.learnMoreLabel && (
              <LearnMoreBtn href={c.learnMoreHref ?? "#"}>{c.learnMoreLabel}</LearnMoreBtn>
            )}
          </Left>
          <Right>
            {c.features.map((feat) => (
              <FeatureCard key={feat.title}>
                <FeatureIcon>{feat.icon}</FeatureIcon>
                <FeatureTitle>{feat.title}</FeatureTitle>
                <FeatureDescription>{feat.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </Right>
        </Flex>
      </Container>
    </Section>
  );
};
