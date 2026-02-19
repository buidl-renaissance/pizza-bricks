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

const DiscordWrap = styled(motion.p)`
  text-align: center;
  margin-top: 1.25rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
`;

const DiscordLink = styled.a`
  color: ${({ theme }) => theme.accent};
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

export const EarlyAccessSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE;

  return (
    <LandingSection id="early-access">
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        Join Early Access
      </Title>
      <WaitlistForm
        type="early_access"
        fields="email"
        unityCheckbox
        submitLabel="Join the list"
      />
      {discordUrl && (
        <DiscordWrap
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          Or join us on <DiscordLink href={discordUrl} target="_blank" rel="noopener noreferrer">Discord</DiscordLink>
        </DiscordWrap>
      )}
    </LandingSection>
  );
};
