import React from "react";
import Head from "next/head";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import { CommunityNavbar } from "@/components/community/CommunityNavbar";
import { CommunityReferBusinessSection } from "@/components/community/CommunityReferBusinessSection";
import { CommunityFooter } from "@/components/community/CommunityFooter";
const PageWrap = styled.main`
  min-height: 100vh;
  width: 100%;
`;

const ReferBusinessPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Refer a Business — Pizza Bricks</title>
        <meta
          name="description"
          content="Know a pizzeria we should reach out to? Share business contact info and your connection."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider theme={pizzaLandingTheme}>
        <div style={{ minHeight: "100vh", background: pizzaLandingTheme.background }}>
          <CommunityNavbar />
          <PageWrap style={{ paddingTop: "4rem" }}>
            <CommunityReferBusinessSection />
          </PageWrap>
          <CommunityFooter />
        </div>
      </ThemeProvider>
    </>
  );
};

export default ReferBusinessPage;
