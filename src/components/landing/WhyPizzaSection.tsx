import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { WHY_PIZZA } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
  text-align: center;
`;

const Block = styled(motion.div)`
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
`;

const Paragraph = styled.p`
  font-family: "Inter", sans-serif;
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  color: ${({ theme }) => theme.textSecondary};
  line-height: 1.7;
  margin: 0 0 1rem;
  &:last-child {
    font-weight: 600;
    color: ${({ theme }) => theme.text};
    margin-bottom: 0;
  }
`;

export const WhyPizzaSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="why-pizza">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🍕 {WHY_PIZZA.title}
      </Title>
      <Block
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {WHY_PIZZA.paragraphs.map((p, i) => (
          <Paragraph key={i}>{p}</Paragraph>
        ))}
      </Block>
    </LandingSection>
  );
};
