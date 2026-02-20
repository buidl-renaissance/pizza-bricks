import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { COMMUNITY_FAQ } from "@/content/communityCopy";

const Section = styled.section`
  padding: clamp(4rem, 10vw, 6rem) 1.5rem;
  background: ${({ theme }) => theme.background};
`;

const Container = styled.div`
  max-width: 640px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const Label = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.backgroundAlt};
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Item = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const QuestionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  text-align: left;
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.text};
  background: none;
  border: none;
  cursor: pointer;
`;

const Plus = styled.span<{ $open: boolean }>`
  color: ${({ theme }) => theme.accent};
  font-size: 1.5rem;
  flex-shrink: 0;
  transition: transform 0.2s;
  transform: ${({ $open }) => ($open ? "rotate(45deg)" : "rotate(0deg)")};
`;

const Answer = styled(motion.div)`
  overflow: hidden;
`;

const AnswerInner = styled.div`
  padding: 0 1.5rem 1.5rem;
  padding-top: 0;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin-top: 0;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 1rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
`;

export const CommunityFAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  const c = COMMUNITY_FAQ;

  return (
    <Section id="faq">
      <Container>
        <Header>
          <Label>{c.label}</Label>
          <Title>{c.title}</Title>
        </Header>
        <List>
          {c.items.map((faq, i) => (
            <Item key={i}>
              <QuestionButton
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span>{faq.q}</span>
                <Plus $open={open === i}>+</Plus>
              </QuestionButton>
              <AnimatePresence initial={false}>
                {open === i && (
                  <Answer
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AnswerInner>{faq.a}</AnswerInner>
                  </Answer>
                )}
              </AnimatePresence>
            </Item>
          ))}
        </List>
      </Container>
    </Section>
  );
};
