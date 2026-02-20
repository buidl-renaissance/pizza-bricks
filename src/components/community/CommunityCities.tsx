import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { COMMUNITY_CITIES } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.background};
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
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const CityCard = styled.div`
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  transition: box-shadow 0.2s, border-color 0.2s;
  &:hover {
    box-shadow: ${({ theme }) => theme.shadow};
    border-color: ${({ theme }) => theme.accent};
  }
`;

const CityCardCta = styled.div`
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.accent};
  background: ${({ theme }) => theme.accentMuted};
  transition: background 0.2s, border-color 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accent};
    border-color: ${({ theme }) => theme.accent};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CityName = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.text};
  margin: 0.25rem 0 0;
`;

const CityFlag = styled.span`
  font-size: 1.875rem;
`;

const Status = styled.span<{ $active?: boolean; $cta?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background: ${({ theme, $active, $cta }) =>
    $cta ? theme.accent : $active ? theme.accentMuted : theme.backgroundAlt};
  color: ${({ theme, $active, $cta }) =>
    $cta ? theme.onAccent ?? theme.signalWhite : $active ? theme.accent : theme.textMuted};
`;

const StatLine = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.25rem;
`;

const ProgressTrack = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 1rem;
`;

const ProgressBar = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  border-radius: 9999px;
  background: linear-gradient(90deg, ${({ theme }) => theme.accentGold}, ${({ theme }) => theme.accent});
`;

const ProgressLabel = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

const JoinLink = styled(Link)`
  display: inline-block;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const CtaBody = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1rem;
  text-align: center;
`;

const CtaButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.accent};
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  }
`;

export const CommunityCities: React.FC = () => {
  const c = COMMUNITY_CITIES;
  return (
    <Section id="cities">
      <Container>
        <Header>
          <Label>{c.label}</Label>
          <Title>{c.title}</Title>
          <Subtitle>{c.subtitle}</Subtitle>
        </Header>
        <Grid>
          {c.cities.map((city) => (
            <CityCard key={city.name}>
              <CardHeader>
                <div>
                  <CityFlag>{city.flag}</CityFlag>
                  <CityName>{city.name}</CityName>
                </div>
              </CardHeader>
              <StatLine>{city.owners}</StatLine>
              <StatLine>{city.bricks}</StatLine>
              <ProgressTrack>
                <ProgressBar $percent={city.progress} />
              </ProgressTrack>
              <ProgressLabel>{city.progress}% Funded</ProgressLabel>
              <JoinLink href={city.joinHref ?? "/#join-pod"}>Join</JoinLink>
            </CityCard>
          ))}
          <CityCardCta>
            <CardHeader>
              <div>
                <CityFlag>{c.yourCity.flag}</CityFlag>
                <CityName>{c.yourCity.name}</CityName>
              </div>
            </CardHeader>
            <CtaBody>{c.yourCity.ctaBody}</CtaBody>
            <CtaButton href="/#join-pod">{c.yourCity.cta}</CtaButton>
          </CityCardCta>
        </Grid>
      </Container>
    </Section>
  );
};
