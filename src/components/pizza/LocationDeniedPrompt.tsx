import React from "react";
import styled from "styled-components";

const Card = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
`;

const Icon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.accentMuted ?? "rgba(196, 30, 58, 0.12)"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1.25rem;
`;

const Title = styled.h3`
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const Body = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 1.5rem;
  max-width: 280px;
  line-height: 1.5;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.onAccent ?? "#fff"};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius ?? "8px"};
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
  }
`;

interface LocationDeniedPromptProps {
  onRetry?: () => void;
}

export function LocationDeniedPrompt({ onRetry }: LocationDeniedPromptProps) {
  return (
    <Card>
      <Icon>📍</Icon>
      <Title>Location access needed</Title>
      <Body>Allow location access to see if you&apos;re in range to unlock this collectible.</Body>
      {onRetry && (
        <Button type="button" onClick={onRetry}>
          Enable location
        </Button>
      )}
    </Card>
  );
}
