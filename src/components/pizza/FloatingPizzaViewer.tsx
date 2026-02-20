"use client";

import React from "react";
import styled, { keyframes, css } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.06); }
  50% { transform: rotate(180deg) scale(0.96); }
  75% { transform: rotate(270deg) scale(1.06); }
  100% { transform: rotate(360deg) scale(1); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
`;

const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 12px rgba(255, 140, 0, 0.5)); }
  50% { filter: drop-shadow(0 0 28px rgba(255, 140, 0, 0.8)); }
`;

const ViewerWrap = styled.div`
  width: 100%;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const PizzaContainer = styled.div<{ $floating?: boolean }>`
  position: relative;
  animation: ${({ $floating }) =>
    $floating !== false ? css`${float} 3s ease-in-out infinite` : "none"};
`;

const PizzaImage = styled.div`
  width: 200px;
  height: 200px;
  animation: ${spin} 6s linear infinite, ${glow} 2.5s ease-in-out infinite;
`;

/* Round pizza SVG - crust, cheese, pepperoni */
const PizzaSvg = () => (
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
  >
    <defs>
      <radialGradient id="cheese" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff3e0" />
        <stop offset="100%" stopColor="#ffb74d" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="88" fill="#8d6e63" stroke="#5d4037" strokeWidth="6" />
    <circle cx="100" cy="100" r="78" fill="url(#cheese)" stroke="#e65100" strokeWidth="2" />
    <circle cx="75" cy="85" r="14" fill="#c62828" />
    <circle cx="120" cy="90" r="12" fill="#c62828" />
    <circle cx="95" cy="115" r="11" fill="#c62828" />
    <circle cx="130" cy="120" r="10" fill="#c62828" />
    <circle cx="70" cy="115" r="10" fill="#c62828" />
  </svg>
);

interface FloatingPizzaViewerProps {
  alt?: string;
  floating?: boolean;
}

export function FloatingPizzaViewer({
  alt = "Floating pizza collectible",
  floating = true,
}: FloatingPizzaViewerProps) {
  return (
    <ViewerWrap>
      <PizzaContainer $floating={floating}>
        <PizzaImage role="img" aria-label={alt}>
          <PizzaSvg />
        </PizzaImage>
      </PizzaContainer>
    </ViewerWrap>
  );
}
