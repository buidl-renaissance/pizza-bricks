import React from "react";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import { CommunityNavbar } from "@/components/community/CommunityNavbar";
import { CommunityFooter } from "@/components/community/CommunityFooter";
import {
  CREATORS_META,
  CREATORS_NAVBAR,
  CREATORS_HERO,
  CREATORS_WHO,
  CREATORS_SUPPORT_BUSINESS,
  CREATORS_BENEFITS,
  CREATORS_HOW_IT_WORKS,
  CREATORS_CTA,
} from "@/content/creatorsCopy";

const PageWrap = styled.main`
  min-height: 100vh;
  width: 100%;
  padding-top: 4rem;
`;

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.background};
`;

const SectionDark = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.text};
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const ContainerNarrow = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

const Label = styled.div`
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: "Righteous", cursive;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
  line-height: 1.2;
`;

const TitleLight = styled.h2`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 1rem;
  line-height: 1.2;
`;

const Subcopy = styled.p`
  font-family: "Inter", sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0;
`;

const SubcopyLight = styled.p`
  font-family: "Inter", sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
`;

// Hero
const HeroSection = styled(Section)`
  min-height: 85vh;
  display: flex;
  align-items: center;
`;

const HeroHeadline = styled.h1`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
`;

const HeroSubcopy = styled.p`
  font-family: "Inter", sans-serif;
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: ${({ theme }) => theme.textSecondary};
  max-width: 36rem;
  line-height: 1.6;
  margin: 0 0 2rem;
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1.125rem;
  color: #FFFFFF;
  background: #E85D5D;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(232, 93, 93, 0.35);
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #D44D4D;
    box-shadow: 0 6px 18px rgba(232, 93, 93, 0.4);
    color: #FFFFFF;
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: "Righteous", cursive;
  font-weight: 600;
  font-size: 1.125rem;
  color: #000000;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    background: #FDF8F3;
    border-color: #E85D5D;
    color: #000000;
  }
`;

// Who It's For
const RolesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 1.5rem;
`;

const RoleChip = styled.span`
  font-family: "Righteous", cursive;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  background: ${({ theme }) => theme.accentMuted};
  color: ${({ theme }) => theme.accent};
  border-radius: 9999px;
`;

// Cards grid
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 1.5rem;
`;

const CardIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.75rem;
`;

const CardTitle = styled.h3`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const CardBody = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

// Benefits list
const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 2rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const BenefitItem = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const BenefitIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const BenefitText = styled.div``;

const BenefitTitle = styled.h3`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem;
`;

const BenefitBody = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

const ExampleBox = styled.div`
  margin-top: 2rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
`;

const ExampleLabel = styled.div`
  font-family: "Righteous", cursive;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 0.5rem;
`;

const ExampleTitle = styled.div`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1rem;
  color: ${({ theme }) => theme.text};
`;

const ExampleSub = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 0.25rem;
`;

// How it works steps
const StepsList = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StepItem = styled.div`
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
`;

const StepNumber = styled.div`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.accent};
  flex-shrink: 0;
`;

const StepContent = styled.div``;

const StepTitle = styled.h3`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.25rem;
`;

const StepBody = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

// Final CTA
const CtaSection = styled(SectionDark)`
  text-align: center;
`;

const CtaTitle = styled.h2`
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  color: ${({ theme }) => theme.signalWhite};
  margin: 0 0 0.5rem;
  line-height: 1.2;
`;

const CtaSubcopy = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1.5rem;
`;

const CtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: "Righteous", cursive;
  font-weight: 700;
  font-size: 1.125rem;
  color: #000000;
  background: #FFE135;
  border: none;
  border-radius: 12px;
  text-decoration: none;
  transition: opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(255, 225, 53, 0.3);
  &:hover {
    opacity: 0.95;
    color: #000000;
    box-shadow: 0 4px 12px rgba(255, 225, 53, 0.4);
  }
`;

const FooterLinks = styled.p`
  text-align: center;
  margin-top: 2rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  a {
    color: ${({ theme }) => theme.accent};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export default function CreatorsPage() {
  return (
    <>
      <Head>
        <title>{CREATORS_META.title}</title>
        <meta name="description" content={CREATORS_META.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={CREATORS_META.title} />
        <meta property="og:description" content={CREATORS_META.description} />
        <meta property="og:type" content="website" />
      </Head>
      <ThemeProvider theme={pizzaLandingTheme}>
        <div style={{ minHeight: "100vh", background: pizzaLandingTheme.background }}>
          <CommunityNavbar navItems={CREATORS_NAVBAR.nav} />
          <PageWrap>
            <HeroSection>
              <Container>
                <HeroHeadline>{CREATORS_HERO.headline}</HeroHeadline>
                <HeroSubcopy>{CREATORS_HERO.subcopy}</HeroSubcopy>
                <CtaRow>
                  <PrimaryButton href={CREATORS_HERO.ctaPrimaryHref}>
                    {CREATORS_HERO.ctaPrimary}
                  </PrimaryButton>
                  <SecondaryButton href={CREATORS_HERO.ctaSecondaryHref}>
                    {CREATORS_HERO.ctaSecondary}
                  </SecondaryButton>
                </CtaRow>
              </Container>
            </HeroSection>

            <Section id="who">
              <Container>
                <Label>{CREATORS_WHO.label}</Label>
                <Title>{CREATORS_WHO.title}</Title>
                <Subcopy>{CREATORS_WHO.subcopy}</Subcopy>
                <RolesList>
                  {CREATORS_WHO.roles.map((role) => (
                    <RoleChip key={role}>{role}</RoleChip>
                  ))}
                </RolesList>
              </Container>
            </Section>

            <SectionDark id="support">
              <Container>
                <Label style={{ color: "rgba(255,255,255,0.6)" }}>
                  {CREATORS_SUPPORT_BUSINESS.label}
                </Label>
                <TitleLight>{CREATORS_SUPPORT_BUSINESS.title}</TitleLight>
                <SubcopyLight>{CREATORS_SUPPORT_BUSINESS.subcopy}</SubcopyLight>
                <CardGrid>
                  {CREATORS_SUPPORT_BUSINESS.cards.map((card) => (
                    <Card key={card.title} style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
                      <CardIcon>{card.icon}</CardIcon>
                      <CardTitle style={{ color: pizzaLandingTheme.signalWhite }}>{card.title}</CardTitle>
                      <CardBody style={{ color: "rgba(255,255,255,0.75)" }}>{card.body}</CardBody>
                    </Card>
                  ))}
                </CardGrid>
              </Container>
            </SectionDark>

            <Section id="benefits">
              <Container>
                <Label>{CREATORS_BENEFITS.label}</Label>
                <Title>{CREATORS_BENEFITS.title}</Title>
                <BenefitsGrid>
                  {CREATORS_BENEFITS.items.map((item) => (
                    <BenefitItem key={item.title}>
                      <BenefitIcon>{item.icon}</BenefitIcon>
                      <BenefitText>
                        <BenefitTitle>{item.title}</BenefitTitle>
                        <BenefitBody>{item.body}</BenefitBody>
                      </BenefitText>
                    </BenefitItem>
                  ))}
                </BenefitsGrid>
                <ExampleBox>
                  <ExampleLabel>{CREATORS_BENEFITS.exampleLabel}</ExampleLabel>
                  <ExampleTitle>{CREATORS_BENEFITS.exampleTitle}</ExampleTitle>
                  <ExampleSub>{CREATORS_BENEFITS.exampleSub}</ExampleSub>
                </ExampleBox>
              </Container>
            </Section>

            <SectionDark id="how">
              <Container>
                <Label style={{ color: "rgba(255,255,255,0.6)" }}>
                  {CREATORS_HOW_IT_WORKS.label}
                </Label>
                <TitleLight>{CREATORS_HOW_IT_WORKS.title}</TitleLight>
                <StepsList>
                  {CREATORS_HOW_IT_WORKS.steps.map((step) => (
                    <StepItem key={step.number}>
                      <StepNumber style={{ color: pizzaLandingTheme.accentGold }}>
                        {step.number}
                      </StepNumber>
                      <StepContent>
                        <StepTitle style={{ color: pizzaLandingTheme.signalWhite }}>
                          {step.title}
                        </StepTitle>
                        <StepBody style={{ color: "rgba(255,255,255,0.75)" }}>
                          {step.body}
                        </StepBody>
                      </StepContent>
                    </StepItem>
                  ))}
                </StepsList>
              </Container>
            </SectionDark>

            <CtaSection>
              <ContainerNarrow>
                <CtaTitle>{CREATORS_CTA.title}</CtaTitle>
                <CtaSubcopy>{CREATORS_CTA.subcopy}</CtaSubcopy>
                <CtaButton href={CREATORS_CTA.ctaHref}>{CREATORS_CTA.ctaLabel}</CtaButton>
                <FooterLinks>
                  <Link href="/">Home</Link> · <Link href="/business">For businesses</Link>
                </FooterLinks>
              </ContainerNarrow>
            </CtaSection>

            <CommunityFooter />
          </PageWrap>
        </div>
      </ThemeProvider>
    </>
  );
}
