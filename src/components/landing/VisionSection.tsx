import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { THE_VISION } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
  text-align: center;
`;

const Intro = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin: 0 0 1.25rem;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
`;

const BulletsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 520px;
`;

const BulletItem = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
  &::before {
    content: "✓";
    color: ${({ theme }) => theme.success};
    font-weight: 700;
  }
`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export const VisionSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="the-vision" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {THE_VISION.title}
      </Title>
      <Intro
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        Pizza Bricks becomes:
      </Intro>
      <BulletsList
        as={motion.ul}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {THE_VISION.bullets.map((bullet, i) => (
          <BulletItem key={i} variants={item}>
            {bullet}
          </BulletItem>
        ))}
      </BulletsList>
    </LandingSection>
  );
};
