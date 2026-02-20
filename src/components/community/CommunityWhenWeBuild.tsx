import React from "react";
import styled from "styled-components";
import { COMMUNITY_WHEN_WE_BUILD } from "@/content/communityCopy";

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

const Label = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.accentMuted};
  color: ${({ theme }) => theme.accent};
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 1.125rem;
  max-width: 36rem;
  margin: 0 auto;
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const RewardCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.border};
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    box-shadow: ${({ theme }) => theme.glow};
  }
`;

const RewardIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const RewardLabel = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const RewardDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
`;

const FootnoteWrap = styled.div`
  max-width: 42rem;
  margin: 0 auto;
  text-align: center;
`;

const Footnote = styled.div`
  display: inline-block;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 1rem 2rem;
  p {
    font-size: 0.875rem;
    font-style: italic;
    color: ${({ theme }) => theme.textSecondary};
    margin: 0;
  }
`;

export const CommunityWhenWeBuild: React.FC = () => {
  const c = COMMUNITY_WHEN_WE_BUILD;
  return (
    <Section>
      <Container>
        <Header>
          <Label>{c.label}</Label>
          <Title>{c.title}</Title>
          <Subtitle>{c.subtitle}</Subtitle>
        </Header>
        <Grid>
          {c.rewards.map((reward) => (
            <RewardCard key={reward.label}>
              <RewardIcon>{reward.icon}</RewardIcon>
              <RewardLabel>{reward.label}</RewardLabel>
              <RewardDescription>{reward.description}</RewardDescription>
            </RewardCard>
          ))}
        </Grid>
        <FootnoteWrap>
          <Footnote>
            <p>{c.footnote}</p>
          </Footnote>
        </FootnoteWrap>
      </Container>
    </Section>
  );
};
