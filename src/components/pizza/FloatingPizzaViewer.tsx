"use client";

import React from "react";
import styled from "styled-components";
import "@google/model-viewer";

const ViewerWrap = styled.div<{ $floating?: boolean }>`
  width: 100%;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $floating }) =>
    $floating &&
    `
    animation: float 3s ease-in-out infinite;
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }
  `}

  model-viewer {
    width: 100%;
    max-width: 320px;
    height: 320px;
    background: transparent;
  }
`;

interface FloatingPizzaViewerProps {
  modelUrl: string;
  iosModelUrl?: string;
  alt?: string;
  ar?: boolean;
  floating?: boolean;
}

export function FloatingPizzaViewer({
  modelUrl,
  iosModelUrl,
  alt = "3D collectible",
  ar = true,
  floating = true,
}: FloatingPizzaViewerProps) {
  return (
    <ViewerWrap $floating={floating}>
      <model-viewer
        src={modelUrl}
        ios-src={iosModelUrl}
        alt={alt}
        ar={ar}
        ar-modes="webxr scene-viewer quick-look"
        camera-orbit="0deg 75deg 2.5m"
        auto-rotate
        camera-controls
        style={{ width: "100%", height: "100%" }}
      />
    </ViewerWrap>
  );
}
