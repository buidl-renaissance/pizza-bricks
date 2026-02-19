import React from "react";
import styled from "styled-components";
import { motion, useInView } from "framer-motion";
import { LandingSection } from "./LandingSection";
import { CITIES } from "@/content/landingCopy";

const Title = styled(motion.h2)`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 1.5rem;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const CityCard = styled(motion.div)`
  padding: 1.25rem;
  background: ${({ theme }) => theme.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.borderSubtle};
`;

const CityName = styled.div`
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.5rem;
`;

const Stat = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textSecondary};
  margin-bottom: 0.25rem;
`;

const YourCityWrap = styled(motion.div)`
  text-align: center;
  margin-top: 1rem;
`;

const YourCityLink = styled.a`
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  font-size: 1.05rem;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

export const CitiesSection: React.FC = () => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const scrollToCity = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("city")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingSection id="cities" brick>
      <Title
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
      >
        📍 {CITIES.title}
      </Title>
      <Grid
        as={motion.div}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        {CITIES.list.map((city) => (
          <CityCard
            key={city.id}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          >
            <CityName>{city.name}</CityName>
            <Stat>Build zones: {city.zones}</Stat>
            <Stat>Bricks collected: {city.bricks.toLocaleString()}</Stat>
            <Stat>Shops unlocked: {city.shops}</Stat>
          </CityCard>
        ))}
      </Grid>
      <YourCityWrap
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3 }}
      >
        <YourCityLink href="#city" onClick={scrollToCity}>
          {CITIES.yourCity}
        </YourCityLink>
      </YourCityWrap>
    </LandingSection>
  );
};
