import React from "react";
import styled from "styled-components";
import { ACTIVATION_ENGINE } from "@/content/businessCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    ${({ theme }) => theme.accentMuted} 0%,
    ${({ theme }) => theme.background} 100%
  );
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  align-items: center;
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Label = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.accent};
  margin: 0 0 1rem;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
`;

const Body = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0 0 2rem;
`;

const DungeonMaster = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
`;

const DungeonMasterBody = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0 0 2rem;
`;

const PillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Pill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const CampaignCard = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.shadowStrong};
  position: relative;
`;

const CampaignBadge = styled.div`
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  font-size: 0.75rem;
  font-weight: 700;
`;

const CampaignPreviewLabel = styled.p`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 0 1.5rem;
`;

const CampaignTitle = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const CampaignSub = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatBox = styled.div<{ $accent?: boolean }>`
  background: ${({ theme }) => theme.backgroundAlt};
  border-radius: 12px;
  padding: 1rem;
  p:first-child {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.textMuted};
    margin: 0 0 0.25rem;
  }
  p:last-child {
    font-family: "Fredoka", "Space Grotesk", sans-serif;
    font-size: 1.25rem;
    color: ${({ theme, $accent }) => ($accent ? theme.accent : theme.text)};
    margin: 0;
  }
`;

const ActivateButton = styled.button`
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, ${({ theme }) => theme.accent} 0%, ${({ theme }) => theme.accentHover} 100%);
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: filter 0.2s;
  &:hover {
    filter: brightness(1.1);
  }
`;

export const ActivationEngine: React.FC = () => {
  const c = ACTIVATION_ENGINE;
  return (
    <Section id="activation">
      <Container>
        <Grid>
          <div>
            <Label>{c.label}</Label>
            <Title>{c.title}</Title>
            <Body>{c.body}</Body>
            <DungeonMaster>{c.dungeonsMaster}</DungeonMaster>
            <DungeonMasterBody>{c.dungeonsMasterBody}</DungeonMasterBody>
            <PillsGrid>
              {c.activations.map((item) => (
                <Pill key={item.label}>
                  <span>{item.icon}</span>
                  {item.label}
                </Pill>
              ))}
            </PillsGrid>
          </div>
          <CampaignCard>
            <CampaignBadge>{c.campaignBadge}</CampaignBadge>
            <CampaignPreviewLabel>{c.campaignPreview}</CampaignPreviewLabel>
            <CampaignTitle>{c.campaignTitle}</CampaignTitle>
            <CampaignSub>{c.campaignSub}</CampaignSub>
            <StatsGrid>
              <StatBox>
                <p>{c.rewardCost}</p>
                <p>{c.rewardCostValue}</p>
              </StatBox>
              <StatBox>
                <p>{c.estReach}</p>
                <p>{c.estReachValue}</p>
              </StatBox>
              <StatBox $accent>
                <p>{c.convLift}</p>
                <p>{c.convLiftValue}</p>
              </StatBox>
              <StatBox $accent>
                <p>{c.roiEst}</p>
                <p>{c.roiEstValue}</p>
              </StatBox>
            </StatsGrid>
            <ActivateButton>{c.activateButton}</ActivateButton>
          </CampaignCard>
        </Grid>
      </Container>
    </Section>
  );
};
