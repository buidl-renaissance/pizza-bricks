import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { COMMUNITY_FOR_OWNERS } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.backgroundAlt};
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: center;
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
  margin: 0 0 1.5rem;
  line-height: 1.2;
`;

const Body = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0 0 2rem;
  max-width: 32rem;
  @media (min-width: 1024px) {
    margin-left: 0;
  }
  margin-left: auto;
  margin-right: auto;
`;

const CtaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  background: ${({ theme }) => theme.accent};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.surface};
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

const Right = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 28rem;
`;

const BenefitCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    box-shadow: ${({ theme }) => theme.shadow};
  }
`;

const BenefitIcon = styled.span`
  font-size: 1.875rem;
  flex-shrink: 0;
`;

const BenefitTitle = styled.span`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  display: block;
  margin-bottom: 0.25rem;
`;

const BenefitText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

export const CommunityForOwners: React.FC = () => {
  const c = COMMUNITY_FOR_OWNERS;
  return (
    <Section id="owners">
      <Container>
        <Flex>
          <Left>
            <Label>{c.label}</Label>
            <Title>{c.title}</Title>
            <Body>{c.body}</Body>
            <CtaRow>
              <PrimaryButton href="/#join-pod">{c.ctaPrimary}</PrimaryButton>
              <SecondaryButton href="/business">{c.ctaSecondary}</SecondaryButton>
            </CtaRow>
          </Left>
          <Right>
            {c.benefits.map((b) => (
              <BenefitCard key={b.title}>
                <BenefitIcon>{b.icon}</BenefitIcon>
                <div>
                  <BenefitTitle>{b.title}</BenefitTitle>
                  <BenefitText>{b.text}</BenefitText>
                </div>
              </BenefitCard>
            ))}
          </Right>
        </Flex>
      </Container>
    </Section>
  );
};
