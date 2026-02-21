import React from "react";
import styled from "styled-components";
import { BUSINESS_FOOTER } from "@/content/businessCopy";

const Footer = styled.footer`
  padding: 2rem 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
`;

const Line1 = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0;
`;

const Line2 = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textMuted};
  margin: 0.25rem 0 0;
`;

export const BusinessFooter: React.FC = () => {
  return (
    <Footer>
      <Container>
        <Line1>{BUSINESS_FOOTER.line1}</Line1>
        <Line2>{BUSINESS_FOOTER.line2}</Line2>
      </Container>
    </Footer>
  );
};
