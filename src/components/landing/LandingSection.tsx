import React from "react";
import styled from "styled-components";

/** Real brick texture: place a tileable image at public/brick-texture.png (or .jpg)
 * Default: OpenGameArt CC0 seamless brick (included). Alternative: ambientCG Bricks038. */

const BRICK_TEXTURE_URL = "/brick-texture.png";

const BRICK_W = 44;
const BRICK_H = 22;
const MORTAR = 1;
const mortarColor = (theme: { brickMortar?: string; border?: string }) =>
  theme.brickMortar ?? "rgba(0,0,0,0.04)";
const brickLineColor = (theme: { brickBrown?: string; border?: string }) =>
  theme.brickBrown ?? theme.border;

const SectionEl = styled.section<{ $brick?: boolean }>`
  width: 100%;
  padding: clamp(3rem, 8vw, 5rem) 1.5rem;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  ${({ theme, $brick }) =>
    $brick &&
    `
    background-color: ${theme.background};
    border-top: 3px solid ${theme.brickGroutBorder ?? '#2a2520'};
    border-bottom: 3px solid ${theme.brickGroutBorder ?? '#2a2520'};
    /* Layers: texture, CSS pattern fallback (no fade overlays) */
    background-image:
      url(${BRICK_TEXTURE_URL}),
      repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent ${BRICK_H - MORTAR}px,
        ${mortarColor(theme)} ${BRICK_H - MORTAR}px,
        ${mortarColor(theme)} ${BRICK_H}px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent ${BRICK_W - MORTAR}px,
        ${brickLineColor(theme)} ${BRICK_W - MORTAR}px,
        ${brickLineColor(theme)} ${BRICK_W}px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent ${BRICK_W - MORTAR}px,
        ${brickLineColor(theme)} ${BRICK_W - MORTAR}px,
        ${brickLineColor(theme)} ${BRICK_W}px
      );
    background-size:
      512px auto,
      ${BRICK_W * 2}px ${BRICK_H * 2}px,
      ${BRICK_W * 2}px ${BRICK_H * 2}px,
      ${BRICK_W * 2}px ${BRICK_H * 2}px;
    background-repeat: repeat, repeat, repeat, repeat;
    background-position:
      0 0,
      0 0,
      0 0,
      ${-BRICK_W / 2}px ${BRICK_H}px;
  `}
`;

const Inner = styled.div<{ $brick?: boolean }>`
  max-width: 960px;
  margin: 0 auto;
  ${({ theme, $brick }) =>
    $brick &&
    theme.brickChalkColor &&
    theme.brickChalkFont &&
    `
    color: ${theme.brickChalkColor};
    font-family: ${theme.brickChalkFont};
    /* Subtle outline for contrast on brick; no solid background */
    text-shadow:
      0 1px 0 rgba(0,0,0,0.15),
      1px 0 0 rgba(0,0,0,0.1),
      -1px 0 0 rgba(0,0,0,0.1),
      0 -1px 0 rgba(0,0,0,0.1);
    & h1, & h2, & h3, & h4, & h5, & h6 {
      font-family: ${theme.brickChalkFont};
      color: inherit;
      background: none;
    }
    & p {
      color: inherit;
      background: none;
    }
    & a {
      color: inherit;
      background: none;
    }
  `}
`;

interface LandingSectionProps {
  children: React.ReactNode;
  brick?: boolean;
  id?: string;
  as?: "section" | "div";
}

export const LandingSection: React.FC<LandingSectionProps> = ({
  children,
  brick = false,
  id,
  as = "section",
}) => (
  <SectionEl as={as} $brick={brick} id={id}>
    <Inner $brick={brick}>{children}</Inner>
  </SectionEl>
);
