import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import { getCollectible, type CollectibleConfig } from "@/content/collectibles";
import { isInRange } from "@/lib/geo";

const FloatingPizzaViewer = dynamic(
  () =>
    import("@/components/pizza/FloatingPizzaViewer").then((m) => m.FloatingPizzaViewer),
  { ssr: false }
);

const Page = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BackLink = styled(Link)`
  align-self: flex-start;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2rem);
  margin: 0 0 0.5rem;
  color: ${({ theme }) => theme.text};
`;

const GeoBadge = styled.div<{ $inRange: boolean }>`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 0.85rem;
  margin-bottom: 1rem;
  background: ${({ theme, $inRange }) => ($inRange ? theme.success + "22" : theme.surface)};
  color: ${({ theme, $inRange }) => ($inRange ? theme.success : theme.textSecondary)};
  border: 1px solid ${({ theme, $inRange }) => ($inRange ? theme.success : theme.border)};
`;

const Message = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0.5rem 0 0;
  max-width: 320px;
  text-align: center;
`;

interface PageProps {
  collectible: CollectibleConfig;
  notFound?: boolean;
}

export async function getServerSideProps(context: {
  params?: { id?: string };
  res: { statusCode: number };
}) {
  const id = context.params?.id;
  if (!id) {
    context.res.statusCode = 404;
    return { props: { notFound: true } };
  }
  const collectible = getCollectible(id);
  if (!collectible) {
    context.res.statusCode = 404;
    return { props: { notFound: true } };
  }
  return { props: { collectible } };
}

export default function PizzaCollectiblePage({ collectible, notFound }: PageProps) {
  const [geoState, setGeoState] = useState<
    "loading" | "in_range" | "out_of_range" | "denied" | "unsupported"
  >("loading");

  useEffect(() => {
    if (!collectible?.geo || typeof window === "undefined") {
      setGeoState("unsupported");
      return;
    }
    if (!navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const inRange = isInRange(
          pos.coords.latitude,
          pos.coords.longitude,
          collectible.geo!.latitude,
          collectible.geo!.longitude,
          collectible.geo!.radiusMeters
        );
        setGeoState(inRange ? "in_range" : "out_of_range");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [collectible?.geo]);

  if (notFound || !collectible) {
    return (
      <ThemeProvider theme={pizzaLandingTheme}>
        <Page>
          <Head>
            <title>Collectible not found — Pizza Bricks</title>
          </Head>
          <BackLink href="/">← Back</BackLink>
          <Title>Not found</Title>
          <Message>This collectible doesn&apos;t exist.</Message>
        </Page>
      </ThemeProvider>
    );
  }

  const showGeo =
    collectible.geo &&
    geoState !== "loading" &&
    geoState !== "unsupported";

  return (
    <ThemeProvider theme={pizzaLandingTheme}>
      <Head>
        <title>{collectible.displayName} — Pizza Bricks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Page>
        <BackLink href="/">← Back to home</BackLink>
        <Title>{collectible.displayName}</Title>
        {showGeo && (
          <GeoBadge $inRange={geoState === "in_range"}>
            {geoState === "in_range"
              ? "You're here! View in your space below."
              : geoState === "out_of_range"
                ? collectible.geo?.placeName
                  ? `Visit ${collectible.geo.placeName} to unlock AR`
                  : "Move to the pin location to view in AR"
                : "Allow location to see if you're in range"}
          </GeoBadge>
        )}
        <FloatingPizzaViewer
          alt={collectible.displayName}
          floating={true}
        />
        {collectible.description && (
          <Message>{collectible.description}</Message>
        )}
      </Page>
    </ThemeProvider>
  );
}
