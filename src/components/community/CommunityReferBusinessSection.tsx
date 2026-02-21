import React from "react";
import styled from "styled-components";
import { CommunityReferBusinessForm } from "./CommunityReferBusinessForm";
import { COMMUNITY_REFER_BUSINESS } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.background};
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
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
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 2rem;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
`;

export const CommunityReferBusinessSection: React.FC = () => {
  const c = COMMUNITY_REFER_BUSINESS;
  return (
    <Section id="refer-business">
      <Container>
        <Label>{c.label}</Label>
        <Title>{c.title}</Title>
        <Subtitle>{c.subtitle}</Subtitle>
        <CommunityReferBusinessForm
          submitLabel={c.submitLabel}
          successMessage={c.successMessage}
        />
      </Container>
    </Section>
  );
};
