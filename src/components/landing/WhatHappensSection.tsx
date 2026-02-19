import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { WHAT_HAPPENS } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
  text-align: center;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
`;

const ListItem = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const ItemIcon = styled.span`
  font-size: 1.5rem;
`;

const ItemLabel = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const Footnote = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  font-style: italic;
  text-align: center;
  margin: 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
`;

export const WhatHappensSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="what-happens" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🏗 {WHAT_HAPPENS.title}
      </Title>
      <List
        as={motion.ul}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {WHAT_HAPPENS.items.map((row, i) => (
          <ListItem
            key={row.label}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          >
            <ItemIcon>{row.icon}</ItemIcon>
            <ItemLabel>{row.label}</ItemLabel>
          </ListItem>
        ))}
      </List>
      <Footnote
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {WHAT_HAPPENS.footnote}
      </Footnote>
    </LandingSection>
  );
};
