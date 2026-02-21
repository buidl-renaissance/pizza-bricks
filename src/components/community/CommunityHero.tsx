import React, { useState } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { COMMUNITY_HERO } from "@/content/communityCopy";

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
`;

const floatBrick = keyframes`
  0%, 100% { transform: translateY(0) rotate(8deg); }
  50% { transform: translateY(-10px) rotate(-4deg); }
`;

const Section = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 6rem 1.5rem 5rem;
  background: ${({ theme }) => theme.background};
`;

/* Grid pattern matching pizza-brick-path brick-texture */
const BgTexture = styled.div`
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
      0deg,
      rgba(108, 99, 91, 0.06) 0px,
      rgba(108, 99, 91, 0.06) 1px,
      transparent 1px,
      transparent 28px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(108, 99, 91, 0.06) 0px,
      rgba(108, 99, 91, 0.06) 1px,
      transparent 1px,
      transparent 60px
    );
  pointer-events: none;
`;

/* Soft radial gradient - matching pizza-brick-path hero */
const BgGradient = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 60% 50%, hsla(4, 72%, 40%, 0.08) 0%, hsla(35, 30%, 96%, 0) 70%);
  pointer-events: none;
`;

const Container = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: center;
    gap: 3rem;
  }
`;

const TextColumn = styled.div`
  flex: 1;
  text-align: center;
  @media (min-width: 1024px) {
    text-align: left;
  }
`;

/* Badge: white/off-white bg, thin border, muted text - matching pizza-brick-path */
const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(108, 99, 91, 0.2);
  background: #FFFFFF;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6C635B;
  margin-bottom: 1.5rem;
`;

/* Righteous font matching pizza-brick-path headlines */
const Headline = styled.h1`
  font-family: "Righteous", cursive;
  font-size: clamp(3rem, 8vw, 4.5rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #281E14;
  margin: 0 0 0.75rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 0;
  @media (min-width: 768px) {
    font-size: clamp(3.5rem, 6vw, 4.5rem);
  }
`;

/* Orange-gold gradient for "of Pizza." - matching pizza-brick-path shimmer-text */
const HeadlineAccent = styled.span`
  display: block;
  background: linear-gradient(
    90deg,
    #FFC700 0%,
    #FFB200 30%,
    #FF8A00 70%,
    #E07000 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 3s linear infinite;
`;

/* DM Sans for body text - matching pizza-brick-path */
const Subcopy = styled.p`
  font-family: "DM Sans", sans-serif;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: #6C635B;
  max-width: 32rem;
  margin: 0 0 1.5rem;
  line-height: 1.5;
  @media (min-width: 1024px) {
    margin-left: 0;
  }
  margin-left: auto;
  margin-right: auto;
`;

const CtaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  @media (min-width: 640px) {
    flex-direction: row;
  }
  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
`;

/* Primary: vibrant red, white text, elevated shadow - matching reference */
const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  color: #FFFFFF;
  background: #CE2828;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(206, 40, 40, 0.35);
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #B82222;
    box-shadow: 0 6px 18px rgba(206, 40, 40, 0.4);
    color: #FFFFFF;
  }
`;

/* Secondary: light beige, dark text, subtle border - matching reference */
const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  font-family: "DM Sans", sans-serif;
  color: #281E14;
  background: #FDF8F3;
  border: 1px solid rgba(108, 99, 91, 0.2);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: rgba(108, 99, 91, 0.35);
    background: #FCF5EF;
    color: #281E14;
  }
`;

const CitiesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  color: #4A3C35;
  margin-top: 1.25rem;
  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
`;

const CityItem = styled.span``;

const CitiesNote = styled.span`
  color: #CE2828;
  font-weight: 600;
`;

const ImageColumn = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  @media (min-width: 1024px) {
    justify-content: flex-end;
  }
`;

const ImageWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 32rem;
`;

const HeroImage = styled.div`
  width: 100%;
  aspect-ratio: 4/3;
  max-height: 380px;
  border-radius: 16px;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: ${({ theme }) => theme.shadowStrong};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HeroImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.875rem;
  background: ${({ theme }) => theme.backgroundAlt};
`;

const StatChip = styled.div<{ $float?: "brick" | "pizza" }>`
  position: absolute;
  background: ${({ theme }) => theme.surface};
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: ${({ theme }) => theme.shadow};
  border: 1px solid ${({ theme }) => theme.border};
  animation: ${({ $float }) => ($float === "brick" ? floatBrick : float)} 4s ease-in-out infinite;
`;

const StatChipTopLeft = styled(StatChip)`
  top: -1rem;
  left: -1rem;
`;

const StatChipBottomRight = styled(StatChip)`
  bottom: -1rem;
  right: -1rem;
`;

const StatValue = styled.div<{ $brick?: boolean }>`
  font-family: "Righteous", cursive;
  font-size: 1.5rem;
  color: ${({ theme, $brick }) => ($brick ? theme.accent : theme.accent)};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
`;

const ScrollHint = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
`;

const ScrollIcon = styled.div`
  width: 1.25rem;
  height: 2rem;
  border-radius: 9999px;
  border: 2px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: center;
  padding-top: 0.375rem;
  div {
    width: 2px;
    height: 8px;
    border-radius: 2px;
    background: ${({ theme }) => theme.textMuted};
  }
`;

export const CommunityHero: React.FC = () => {
  const c = COMMUNITY_HERO;
  const [imgError, setImgError] = useState(false);
  return (
    <Section>
      <BgTexture />
      <BgGradient />
      <Container>
        <TextColumn>
          <Badge>{c.badge}</Badge>
          <Headline>
            <span>{c.headlineLine1}</span>
            <span>{c.headlineLine2}</span>
            <HeadlineAccent>{c.headlineAccent}</HeadlineAccent>
          </Headline>
          <Subcopy>{c.subcopy}</Subcopy>
          <CtaRow>
            <PrimaryButton href="#join-pod">{c.ctaPrimary}</PrimaryButton>
            <SecondaryButton href="/business">{c.ctaSecondary}</SecondaryButton>
          </CtaRow>
          <CitiesRow>
            {c.cities.map((city) => (
              <CityItem key={city.name}>
                {city.emoji} {city.name}
              </CityItem>
            ))}
            <CitiesNote>{c.citiesNote}</CitiesNote>
          </CitiesRow>
        </TextColumn>
        <ImageColumn>
          <ImageWrap>
            <HeroImage>
              {!imgError ? (
                <img
                  src="/hero-pizza.png"
                  alt={c.heroImageAlt}
                  onError={() => setImgError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <HeroImagePlaceholder>🍕🧱</HeroImagePlaceholder>
              )}
            </HeroImage>
            <StatChipTopLeft $float="brick">
              <StatValue $brick>{c.statChip1Value}</StatValue>
              <StatLabel>{c.statChip1Label}</StatLabel>
            </StatChipTopLeft>
            <StatChipBottomRight $float="pizza">
              <StatValue>{c.statChip2Value}</StatValue>
              <StatLabel>{c.statChip2Label}</StatLabel>
            </StatChipBottomRight>
          </ImageWrap>
        </ImageColumn>
      </Container>
      <ScrollHint>
        <span>{c.scrollHint}</span>
        <ScrollIcon><div /></ScrollIcon>
      </ScrollHint>
    </Section>
  );
};
