import React, { useState } from "react";
import styled from "styled-components";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { FAQ_ITEMS } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
  text-align: center;
`;

const List = styled.div`
  max-width: 560px;
  margin: 0 auto;
`;

const Item = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.borderSubtle};
  &:first-of-type {
    border-top: 1px solid ${({ theme }) => theme.borderSubtle};
  }
`;

const QuestionButton = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

const Answer = styled(motion.div)`
  overflow: hidden;
`;

const AnswerInner = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.6;
  margin: 0 0 1rem;
  padding-left: 0;
`;

export const FAQSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LandingSection id="faq">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🧠 FAQ
      </Title>
      <List>
        {FAQ_ITEMS.map((faq, i) => (
          <Item key={i}>
            <QuestionButton
              type="button"
              $open={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
              aria-controls={`faq-answer-${i}`}
              id={`faq-question-${i}`}
            >
              {faq.q}
              <span aria-hidden>{openIndex === i ? "−" : "+"}</span>
            </QuestionButton>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <Answer
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
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
    </LandingSection>
  );
};
