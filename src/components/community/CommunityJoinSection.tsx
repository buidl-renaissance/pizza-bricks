import React from "react";
import styled from "styled-components";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

const Section = styled.section`
  padding: clamp(3rem, 8vw, 5rem) 1.5rem;
  background: ${({ theme }) => theme.background};
`;

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
`;

const DiscordWrap = styled.p`
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const DiscordLink = styled.a`
  color: ${({ theme }) => theme.accent};
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const CommunityJoinSection: React.FC = () => {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE;

  return (
    <Section id="join-pod">
      <Container>
        <Title>Join Early Access</Title>
        <Subtitle>Be among the first to build the future of pizza.</Subtitle>
        <WaitlistForm
          type="early_access"
          fields="email"
          submitLabel="Join the list"
        />
        {discordUrl && (
          <DiscordWrap>
            Or join us on <DiscordLink href={discordUrl} target="_blank" rel="noopener noreferrer">Discord</DiscordLink>
          </DiscordWrap>
        )}
      </Container>
    </Section>
  );
};
