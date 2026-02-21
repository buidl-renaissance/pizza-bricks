import React from 'react';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ theme, $active }) => $active ? theme.accent : theme.border};
  background: ${({ theme, $active }) => $active ? theme.accentMuted : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.accent : theme.textMuted};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.accent};
  }
`;

export const FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Email', value: 'email' },
  { label: 'Sites', value: 'site' },
  { label: 'Discovery', value: 'discovery' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Errors', value: 'error' },
  { label: 'Manual', value: 'manual' },
] as const;

export type FilterValue = typeof FILTER_OPTIONS[number]['value'];

interface FilterBarProps {
  active: FilterValue;
  onChange: (v: FilterValue) => void;
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <Bar>
      {FILTER_OPTIONS.map(opt => (
        <Chip
          key={opt.value}
          $active={active === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Chip>
      ))}
    </Bar>
  );
}
