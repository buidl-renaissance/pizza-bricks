"use client";

import React from "react";
import styled, { keyframes, css } from "styled-components";

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
  perspective: 400px;
  animation: ${({ $floating }) =>
    $floating !== false ? css`${float} 3s ease-in-out infinite` : "none"};
`;

const PizzaImage = styled.div`
  width: 200px;
  height: 200px;
  animation: ${glow} 2.5s ease-in-out infinite;
`;


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
          <img src="/pizza-slice.png" alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </PizzaImage>
      </PizzaContainer>
    </ViewerWrap>
  );
}
