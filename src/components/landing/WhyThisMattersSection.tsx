import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { WHY_THIS_MATTERS } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 2rem;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
`;

const Column = styled(motion.div)`
  padding: 1.5rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const ColumnTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
`;

const BulletList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BulletItem = styled.li`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.4rem;
  padding-left: 1.25rem;
  position: relative;
  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: ${({ theme }) => theme.accent};
    font-weight: 700;
  }
`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export const WhyThisMattersSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const columns = [
    { title: WHY_THIS_MATTERS.businessOwners.title, items: WHY_THIS_MATTERS.businessOwners.items },
    { title: WHY_THIS_MATTERS.community.title, items: WHY_THIS_MATTERS.community.items },
    { title: WHY_THIS_MATTERS.creators.title, items: WHY_THIS_MATTERS.creators.items },
  ];

  return (
    <LandingSection id="why-this-matters">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {WHY_THIS_MATTERS.title}
      </Title>
      <Grid
        as={motion.div}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {columns.map((col, i) => (
          <Column key={col.title} variants={item}>
            <ColumnTitle>{col.title}</ColumnTitle>
            <BulletList>
              {col.items.map((bullet, j) => (
                <BulletItem key={j}>{bullet}</BulletItem>
              ))}
            </BulletList>
          </Column>
        ))}
      </Grid>
    </LandingSection>
  );
};
