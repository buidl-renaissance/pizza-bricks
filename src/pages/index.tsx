import React from "react";
import Head from "next/head";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import {
  HeroSection,
  HowItWorksSection,
  EarlyAccessSection,
  WhyPizzaSection,
  WhatHappensSection,
  RenaissanceSection,
  CitiesSection,
  CityFormSection,
  PizzeriaSection,
  PizzeriaFormSection,
  FAQSection,
  FinalCTASection,
} from "@/components/landing";
import { APP_NAME, POSITIONING } from "@/content/landingCopy";

const PageWrap = styled.main`
  min-height: 100vh;
  width: 100%;
`;

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>{APP_NAME} — Build the Future of Pizza</title>
        <meta name="description" content={POSITIONING} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content={`${APP_NAME} — Build the Future of Pizza`} />
        <meta property="og:description" content={POSITIONING} />
        <meta property="og:type" content="website" />
      </Head>
      <ThemeProvider theme={pizzaLandingTheme}>
        <PageWrap>
          <HeroSection />
          <HowItWorksSection />
          <EarlyAccessSection />
          <WhyPizzaSection />
          <WhatHappensSection />
          <RenaissanceSection />
          <CitiesSection />
          <CityFormSection />
          <PizzeriaSection />
          <PizzeriaFormSection />
          <FAQSection />
          <FinalCTASection />
        </PageWrap>
      </ThemeProvider>
    </>
  );
};

export default HomePage;
