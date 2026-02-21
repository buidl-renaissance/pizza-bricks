import React from "react";
import Head from "next/head";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import { BusinessNavbar } from "@/components/business/BusinessNavbar";
import { BusinessHero } from "@/components/business/BusinessHero";
import { GrowthAgents } from "@/components/business/GrowthAgents";
import { ActivationEngine } from "@/components/business/ActivationEngine";
import { BusinessHowItWorks } from "@/components/business/BusinessHowItWorks";
import { WhyTheGame } from "@/components/business/WhyTheGame";
import { CommunityReferBusinessLink } from "@/components/community/CommunityReferBusinessLink";
import { BusinessCTA } from "@/components/business/BusinessCTA";
import { BusinessFooter } from "@/components/business/BusinessFooter";
import { BUSINESS_META } from "@/content/businessCopy";

const PageWrap = styled.main`
  min-height: 100vh;
  width: 100%;
`;

const BusinessPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>{BUSINESS_META.title}</title>
        <meta name="description" content={BUSINESS_META.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={BUSINESS_META.title} />
        <meta property="og:description" content={BUSINESS_META.description} />
        <meta property="og:type" content="website" />
      </Head>
      <ThemeProvider theme={pizzaLandingTheme}>
        <div style={{ minHeight: "100vh", background: pizzaLandingTheme.background }}>
          <BusinessNavbar />
          <PageWrap style={{ paddingTop: "4rem" }}>
            <BusinessHero />
            <GrowthAgents />
            <ActivationEngine />
            <BusinessHowItWorks />
            <WhyTheGame />
            <CommunityReferBusinessLink />
            <BusinessCTA />
          </PageWrap>
          <BusinessFooter />
        </div>
      </ThemeProvider>
    </>
  );
};

export default BusinessPage;
