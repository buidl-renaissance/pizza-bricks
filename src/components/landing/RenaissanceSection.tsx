import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { RENAISSANCE } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.75rem;
  text-align: center;
`;

const Intro = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin: 0 0 1.5rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  max-width: 560px;
  margin: 0 auto;
`;

const BenefitItem = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  &::before {
    content: "✓";
    color: ${({ theme }) => theme.success};
    font-weight: 700;
  }
`;

export const RenaissanceSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="renaissance">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🌆 {RENAISSANCE.title}
      </Title>
      <Intro
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {RENAISSANCE.intro}
      </Intro>
      <BenefitsList
        as={motion.ul}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {RENAISSANCE.benefits.map((b) => (
          <BenefitItem
            key={b}
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
          >
            {b}
          </BenefitItem>
        ))}
      </BenefitsList>
    </LandingSection>
  );
};
