import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { BUSINESS_CTA } from "@/content/businessCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent} 0%, ${({ theme }) => theme.accentHover} 100%);
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("/brick-texture.png");
    background-repeat: repeat;
    opacity: 0.12;
    pointer-events: none;
  }
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 5vw, 3.75rem);
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  margin: 0 0 1.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 36rem;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.accentGold};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.1);
    color: ${({ theme }) => theme.text};
  }
`;

const OutlineButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.signalWhite};
    background: rgba(255, 255, 255, 0.1);
    color: ${({ theme }) => theme.signalWhite};
  }
`;

export const BusinessCTA: React.FC = () => {
  return (
    <Section>
      <Container>
        <Title>{BUSINESS_CTA.title}</Title>
        <Subtitle>{BUSINESS_CTA.subtitle}</Subtitle>
        <ButtonRow>
          {BUSINESS_CTA.buttons.map((btn) =>
            btn.primary ? (
              <PrimaryButton key={btn.label} href={btn.href}>
                {btn.label}
              </PrimaryButton>
            ) : (
              <OutlineButton key={btn.label} href={btn.href}>
                {btn.label}
              </OutlineButton>
            )
          )}
        </ButtonRow>
      </Container>
    </Section>
  );
};
