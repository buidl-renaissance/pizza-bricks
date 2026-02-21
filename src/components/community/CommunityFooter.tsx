import React from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { COMMUNITY_FOOTER } from "@/content/communityCopy";

const PIZZADAO_LOGO_WHITE =
  "https://pizzadao.github.io/pizzadao-brand-kit/pizzadao-logos/pizzadao-logo-white.png";

const Footer = styled.footer`
  padding: 3rem 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: #000000;
`;

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`;

const Top = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2.5rem;
`;

const LogoBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Righteous", cursive;
  font-size: 1.125rem;
  font-weight: 600;
`;

const Columns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem 3rem;
`;

const Column = styled.div`
  min-width: 100px;
`;

const ColumnTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 800;
  font-family: "Righteous", cursive;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
`;

const ColumnLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ColumnLink = styled(Link)`
  font-size: 0.875rem;
  font-family: "Righteous", cursive;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  &:hover {
    color: #7DD3E8;
  }
`;

const Bottom = styled.div`
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
`;

const Copyright = styled.p`
  font-size: 0.8125rem;
  font-family: "Righteous", cursive;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
`;

export const CommunityFooter: React.FC = () => {
  const f = COMMUNITY_FOOTER;
  if (!("columns" in f)) {
    return (
      <Footer>
        <Container style={{ textAlign: "center" }}>
          <Copyright>{(f as { line1?: string; line2?: string }).line1}</Copyright>
          <Copyright style={{ marginTop: "0.25rem" }}>{(f as { line2?: string }).line2}</Copyright>
        </Container>
      </Footer>
    );
  }
  return (
    <Footer>
      <Container>
        <Top>
          <LogoBlock>
            <Image
              src={PIZZADAO_LOGO_WHITE}
              alt="PizzaDAO"
              width={120}
              height={30}
            />
          </LogoBlock>
          <Columns>
            {f.columns.map((col) => (
              <Column key={col.title}>
                <ColumnTitle>{col.title}</ColumnTitle>
                <ColumnLinks>
                  {col.links.map((link) => (
                    <ColumnLink key={link.label} href={link.href}>
                      {link.label}
                    </ColumnLink>
                  ))}
                </ColumnLinks>
              </Column>
            ))}
          </Columns>
        </Top>
        <Bottom>
          <Copyright>{f.copyright}</Copyright>
        </Bottom>
      </Container>
    </Footer>
  );
};
