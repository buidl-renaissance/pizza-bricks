import React from "react";
import Head from "next/head";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import { CommunityNavbar } from "@/components/community/CommunityNavbar";
import { CommunityHero } from "@/components/community/CommunityHero";
import { CommunityHowItWorks } from "@/components/community/CommunityHowItWorks";
import { CommunityWhyPizza } from "@/components/community/CommunityWhyPizza";
import { CommunityPoweredBy } from "@/components/community/CommunityPoweredBy";
import { CommunityCities } from "@/components/community/CommunityCities";
import { CommunityForOwners } from "@/components/community/CommunityForOwners";
import { CommunityReferBusinessLink } from "@/components/community/CommunityReferBusinessLink";
import { CommunityFAQ } from "@/components/community/CommunityFAQ";
import { CommunityJoinSection } from "@/components/community/CommunityJoinSection";
import { CommunityFinalCTA } from "@/components/community/CommunityFinalCTA";
import { CommunityFooter } from "@/components/community/CommunityFooter";
import { COMMUNITY_META } from "@/content/communityCopy";

const PageWrap = styled.main`
  min-height: 100vh;
  width: 100%;
`;

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>{COMMUNITY_META.title}</title>
        <meta name="description" content={COMMUNITY_META.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={COMMUNITY_META.title} />
        <meta property="og:description" content={COMMUNITY_META.description} />
        <meta property="og:type" content="website" />
      </Head>
      <ThemeProvider theme={pizzaLandingTheme}>
        <div style={{ minHeight: "100vh", background: pizzaLandingTheme.background }}>
          <CommunityNavbar />
          <PageWrap style={{ paddingTop: "4rem" }}>
            <CommunityHero />
            <CommunityHowItWorks />
            <CommunityWhyPizza />
            <CommunityPoweredBy />
            <CommunityCities />
            <CommunityForOwners />
            <CommunityReferBusinessLink />
            <CommunityFAQ />
            <CommunityJoinSection />
            <CommunityFinalCTA />
          </PageWrap>
          <CommunityFooter />
        </div>
      </ThemeProvider>
    </>
  );
};

export default HomePage;
