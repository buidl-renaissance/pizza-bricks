import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { COMMUNITY_REFER_BUSINESS } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(3rem, 8vw, 5rem) 1.5rem;
  background: ${({ theme }) => theme.background};
`;

const Container = styled.div`
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 2rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
    box-shadow: ${({ theme }) => theme.shadow};
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
  margin-bottom: 1rem;
`;

const Title = styled.p`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.25rem;
`;

const CtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
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

export const CommunityReferBusinessLink: React.FC = () => {
  const c = COMMUNITY_REFER_BUSINESS;
  return (
    <Section id="refer-business">
      <Container>
        <Card>
          <Label>{c.label}</Label>
          <Title>{c.linkCta}</Title>
          <CtaLink href="/refer-business">{c.linkText}</CtaLink>
        </Card>
      </Container>
    </Section>
  );
};
