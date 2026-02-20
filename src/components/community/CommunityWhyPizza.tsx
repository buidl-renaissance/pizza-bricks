import React from "react";
import styled from "styled-components";
import { COMMUNITY_WHY_PIZZA } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
`;

const BgBlur = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  background: radial-gradient(circle, ${({ theme }) => theme.accent} 0%, transparent 70%);
  opacity: 0.08;
  pointer-events: none;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  max-width: 48rem;
  margin: 0 auto;
  text-align: center;
  margin-bottom: 2rem;
`;

const Emoji = styled.div`
  font-size: 5rem;
  margin-bottom: 2rem;
`;

const Label = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.accentMuted};
  color: ${({ theme }) => theme.accent};
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 2rem;
  line-height: 1.2;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  text-align: left;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: ${({ theme }) => theme.shadow};
  }
`;

const CardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const CardBody = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0;
`;

export const CommunityWhyPizza: React.FC = () => {
  const c = COMMUNITY_WHY_PIZZA;
  return (
    <Section id="why">
      <BgBlur />
      <Container>
        <Header>
          <Emoji>🍕</Emoji>
          <Label>{c.label}</Label>
          <Title>{c.title}</Title>
        </Header>
        <Grid>
          {c.cards.map((card) => (
            <Card key={card.title}>
              <CardIcon>{card.icon}</CardIcon>
              <CardTitle>{card.title}</CardTitle>
              <CardBody>{card.body}</CardBody>
            </Card>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};
