import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { PROBLEM } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
  text-align: center;
`;

const Intro = styled(motion.p)`
  font-family: "Inter", sans-serif;
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  color: ${({ theme }) => theme.textSecondary};
  text-align: center;
  margin: 0 0 1.5rem;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
`;

const Subhead = styled(motion.p)`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
  text-align: center;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto 1.5rem;
  max-width: 400px;
  text-align: left;
`;

const ListItem = styled(motion.li)`
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.35rem;
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

const Close = styled(motion.p)`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1rem, 2vw, 1.15rem);
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin: 1.5rem 0 0;
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

export const ProblemSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="the-problem">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        {PROBLEM.title}
      </Title>
      <Intro
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {PROBLEM.intro}
      </Intro>
      <Subhead
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {PROBLEM.subhead}
      </Subhead>
      <List
        as={motion.ul}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {PROBLEM.failureReasons.map((reason, i) => (
          <ListItem key={i} variants={item}>
            {reason}
          </ListItem>
        ))}
      </List>
      <Subhead
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {PROBLEM.meanwhile}
      </Subhead>
      <List
        as={motion.ul}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {PROBLEM.desires.map((d, i) => (
          <ListItem key={i} variants={item}>
            {d}
          </ListItem>
        ))}
      </List>
      <Close
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        {PROBLEM.close}
      </Close>
    </LandingSection>
  );
};
