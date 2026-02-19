import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { PIZZERIA } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
  text-align: center;
`;

const Bullets = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const BulletItem = styled(motion.li)`
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.5rem;
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

const CtaWrap = styled(motion.div)`
  text-align: center;
`;

const CtaButton = styled.a`
  display: inline-block;
  padding: 0.875rem 1.75rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.signalWhite};
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

export const PizzeriaSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="pizzeria-partners">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        🧑‍🍳 {PIZZERIA.title}
      </Title>
      <Bullets
        as={motion.ul}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {PIZZERIA.bullets.map((b) => (
          <BulletItem
            key={b}
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
          >
            {b}
          </BulletItem>
        ))}
      </Bullets>
      <CtaWrap
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.25 }}
      >
        <CtaButton href="#pizzeria-form">{PIZZERIA.cta}</CtaButton>
      </CtaWrap>
    </LandingSection>
  );
};
