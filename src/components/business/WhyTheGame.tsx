import React from "react";
import styled from "styled-components";
import { WHY_THE_GAME } from "@/content/businessCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Header = styled.div`
  max-width: 48rem;
  margin: 0 auto 4rem;
  text-align: center;
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
  strong {
    color: ${({ theme }) => theme.text};
  }
`;

const TableWrap = styled.div`
  max-width: 40rem;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.border};
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

const TableHeader = styled.div<{ $withGame?: boolean }>`
  padding: 1rem;
  background: ${({ theme, $withGame }) => ($withGame ? theme.accent : theme.backgroundAlt)};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  color: ${({ theme, $withGame }) => ($withGame ? theme.onAccent ?? theme.signalWhite : theme.textSecondary)};
`;

const TableCell = styled.div<{ $withGame?: boolean }>`
  padding: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme, $withGame }) => ($withGame ? theme.text : theme.textSecondary)};
  font-weight: ${({ $withGame }) => ($withGame ? 600 : 400)};
  background: ${({ theme, $withGame }) => ($withGame ? theme.accentMuted : "transparent")};
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  &:last-child ${TableCell} {
    border-bottom: none;
  }
`;

const Callout = styled.div`
  max-width: 40rem;
  margin: 2rem auto 0;
  padding: 1.5rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.accentMuted};
  border: 1px solid ${({ theme }) => theme.accent};
`;

const CalloutTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const CalloutBody = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0;
  strong {
    color: ${({ theme }) => theme.text};
  }
`;

export const WhyTheGame: React.FC = () => {
  const c = WHY_THE_GAME;
  return (
    <Section>
      <Container>
        <Header>
          <Label>{c.label}</Label>
          <Title>{c.title}</Title>
          <Body>{c.body}</Body>
        </Header>
        <TableWrap>
          <Table>
            <TableRow>
              <TableHeader>{c.withoutGame}</TableHeader>
              <TableHeader $withGame>{c.withGame}</TableHeader>
            </TableRow>
            {c.comparisons.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.without}</TableCell>
                <TableCell $withGame>{row.withGame} ✨</TableCell>
              </TableRow>
            ))}
          </Table>
        </TableWrap>
        <Callout>
          <CalloutTitle>{c.zeroEffortTitle}</CalloutTitle>
          <CalloutBody>{c.zeroEffortBody}</CalloutBody>
        </Callout>
      </Container>
    </Section>
  );
};
