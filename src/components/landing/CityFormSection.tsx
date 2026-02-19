import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { WaitlistForm } from "./WaitlistForm";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1rem;
  text-align: center;
`;

export const CityFormSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <LandingSection id="city">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        Bring It to My City
      </Title>
      <WaitlistForm
        type="city"
        fields="email-city"
        submitLabel="Notify me"
      />
    </LandingSection>
  );
};
