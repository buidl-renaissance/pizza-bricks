import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { COMMUNITY_FOOTER } from "@/content/communityCopy";

const Footer = styled.footer`
  padding: 3rem 1.5rem 2rem;
  border-top: 1px solid rgba(253, 248, 243, 0.1);
  background: #0f0d0b;
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
  color: rgba(253, 248, 243, 0.5);
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
`;

const LogoEmoji = styled.span`
  font-size: 1.5rem;
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
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(253, 248, 243, 0.5);
  margin-bottom: 1rem;
`;

const ColumnLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ColumnLink = styled(Link)`
  font-size: 0.875rem;
  color: rgba(253, 248, 243, 0.4);
  text-decoration: none;
  &:hover {
    color: rgba(253, 248, 243, 0.7);
  }
`;

const Bottom = styled.div`
  padding-top: 1.5rem;
  border-top: 1px solid rgba(253, 248, 243, 0.08);
  text-align: center;
`;

const Copyright = styled.p`
  font-size: 0.8125rem;
  color: rgba(253, 248, 243, 0.35);
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
            <LogoEmoji>🍕🧱</LogoEmoji>
            <span>{f.logo}</span>
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
