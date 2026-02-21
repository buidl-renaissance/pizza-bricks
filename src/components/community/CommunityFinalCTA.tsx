import React from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { COMMUNITY_FINAL_CTA } from "@/content/communityCopy";

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
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

const BgGradient = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 50% 50%, ${({ theme }) => theme.accentMuted} 0%, transparent 70%);
  pointer-events: none;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
`;

const Emoji = styled.div`
  font-size: 5rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-family: "Righteous", cursive;
  font-weight: 900;
  font-size: clamp(2.5rem, 5vw, 4rem);
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 0.5rem;
  line-height: 1.1;
`;

const TitleAccent = styled.span`
  display: inline-block;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.accentGold} 25%,
    ${({ theme }) => theme.accent} 50%,
    ${({ theme }) => theme.accentGold} 75%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 3s linear infinite;
`;

const Subtitle = styled.p`
  font-family: "Righteous", cursive;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 32rem;
  margin: 0 auto 3rem;
  line-height: 1.6;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 4rem;
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
  font-weight: 800;
  font-family: "Righteous", cursive;
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

const OutlineButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  font-weight: 800;
  font-family: "Righteous", cursive;
  color: ${({ theme }) => theme.signalWhite};
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.signalWhite};
    background: rgba(255, 255, 255, 0.1);
    color: ${({ theme }) => theme.signalWhite};
  }
`;

const AccentButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  font-weight: 800;
  font-family: "Righteous", cursive;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.accentGold};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
    color: ${({ theme }) => theme.text};
  }
`;

const LinkRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-size: 0.875rem;
  font-family: "Righteous", cursive;
  color: rgba(255, 255, 255, 0.5);
  a {
    color: inherit;
    text-decoration: none;
    &:hover {
      color: ${({ theme }) => theme.signalWhite};
    }
  }
`;

export const CommunityFinalCTA: React.FC = () => {
  const c = COMMUNITY_FINAL_CTA;
  return (
    <Section>
      <BgTexture />
      <BgGradient />
      <Container>
        <Emoji>🍕</Emoji>
        <Title>
          {c.title}
          <br />
          <TitleAccent>{c.titleAccent}</TitleAccent>
        </Title>
        <Subtitle>{c.subtitle}</Subtitle>
        <ButtonRow>
          {c.buttons.map((btn) =>
            btn.variant === "outline" ? (
              <OutlineButton key={btn.label} href={btn.href}>{btn.label}</OutlineButton>
            ) : btn.variant === "accent" ? (
              <AccentButton key={btn.label} href={btn.href}>{btn.label}</AccentButton>
            ) : (
              <PrimaryButton key={btn.label} href={btn.href}>{btn.label}</PrimaryButton>
            )
          )}
        </ButtonRow>
        <LinkRow>
          {c.links.map((link, i) => (
            <React.Fragment key={link.label}>
              {i > 0 && <span>·</span>}
              <a href={link.href}>{link.label}</a>
            </React.Fragment>
          ))}
        </LinkRow>
      </Container>
    </Section>
  );
};
