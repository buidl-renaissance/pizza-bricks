import { DefaultTheme } from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    // Core
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceHover: string;
    
    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Borders
    border: string;
    borderSubtle: string;
    borderRadius: string;
    
    // Accents
    accent: string;
    accentHover: string;
    accentMuted: string;
    accentGlow: string;
    accentGold: string;
    
    // Status
    live: string;
    liveGlow: string;
    success: string;
    warning: string;
    danger: string;
    
    // Effects
    shadow: string;
    shadowStrong: string;
    overlay: string;
    glow: string;
    
    // Named Colors (Into the Void palette)
    signalWhite: string;
    steelGray: string;
    infraRed: string;

    // Optional: text on accent background (e.g. primary buttons). Falls back to signalWhite.
    onAccent?: string;

    // Pizza Bricks landing (optional; used only on landing page)
    pizzaRed?: string;
    pizzaCream?: string;
    brickBrown?: string;
    brickMortar?: string;
    brickGroutBorder?: string;
    brickChalkColor?: string;
    brickChalkFont?: string;
  }
}

// Into the Void - Dark Theme
// Underground tournament energy, ritualistic, competitive
export const darkTheme: DefaultTheme = {
  // Core backgrounds
  background: '#0B0B0D',           // Void Black
  backgroundAlt: '#16181C',        // Obsidian Charcoal
  surface: '#16181C',              // Obsidian Charcoal
  surfaceHover: '#1E2127',         // Slightly lighter for hover
  
  // Text
  text: '#F5F7FA',                 // Signal White
  textSecondary: '#9CA3AF',        // Muted gray
  textMuted: '#6B7280',            // Even more muted
  
  // Borders
  border: '#2A2E35',               // Steel Gray
  borderSubtle: '#1E2127',         // Subtle border
  borderRadius: '8px',
  
  // Accents - Electric Violet (use sparingly)
  accent: '#7B5CFF',               // Electric Violet
  accentHover: '#8F73FF',          // Lighter violet
  accentMuted: 'rgba(123, 92, 255, 0.15)',
  accentGlow: 'rgba(123, 92, 255, 0.4)',
  accentGold: '#8F73FF',           // Legacy support - maps to lighter violet
  
  // Status
  live: '#E14B4B',                 // Infra Red (live/finals only)
  liveGlow: 'rgba(225, 75, 75, 0.3)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Effects
  shadow: 'rgba(0, 0, 0, 0.5)',
  shadowStrong: 'rgba(0, 0, 0, 0.8)',
  overlay: 'rgba(11, 11, 13, 0.9)',
  glow: '0 0 20px rgba(123, 92, 255, 0.3)',
  
  // Named Colors (Into the Void palette)
  signalWhite: '#F5F7FA',
  steelGray: '#2A2E35',
  infraRed: '#E14B4B',

  pizzaRed: '#7B5CFF',
  pizzaCream: '#F5F7FA',
  brickBrown: '#2A2E35',
  brickMortar: 'rgba(0,0,0,0.06)',
  brickGroutBorder: '#1a1918',
  brickChalkColor: '#F4E4A6',
  brickChalkFont: '"Permanent Marker", "Caveat", cursive',
};

// Pizza Bricks landing — PizzaDAO brand palette
// Pizza Yellow #FFE135 | Pizza Red #E85D5D | Earth Blue #7DD3E8 | Black #000000 | White #FFFFFF
export const pizzaLandingTheme: DefaultTheme = {
  ...darkTheme,
  background: '#FFFFFF',
  backgroundAlt: '#FDF8F3',
  surface: '#FFFFFF',
  surfaceHover: '#FDF8F3',
  text: '#000000',
  textSecondary: '#3D3028',
  textMuted: '#4A3C35',
  border: '#E0DED9',
  borderSubtle: '#E8E6E1',
  borderRadius: '8px',
  accent: '#E85D5D',       // Pizza Red
  accentHover: '#D44D4D',
  accentMuted: 'rgba(232, 93, 93, 0.12)',
  accentGlow: 'rgba(232, 93, 93, 0.25)',
  accentGold: '#FFE135',   // Pizza Yellow
  live: '#E85D5D',
  liveGlow: 'rgba(232, 93, 93, 0.3)',
  success: '#1A7B3A',
  warning: '#B45309',
  danger: '#E85D5D',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
  overlay: 'rgba(255, 255, 255, 0.95)',
  glow: '0 0 20px rgba(255, 225, 53, 0.2)',
  signalWhite: '#FFFFFF',
  onAccent: '#FFFFFF',
  steelGray: '#E0DED9',
  infraRed: '#E85D5D',
  pizzaRed: '#E85D5D',
  pizzaCream: '#FFFFFF',
  brickBrown: '#6B5344',
  brickMortar: 'rgba(0, 0, 0, 0.06)',
  brickGroutBorder: '#2a2520',
  brickChalkColor: '#000000',
  brickChalkFont: '"Righteous", "Permanent Marker", cursive',
};

// Light theme (kept for compatibility, but app should default to dark)
export const lightTheme: DefaultTheme = {
  background: '#F5F7FA',
  backgroundAlt: '#E5E7EB',
  surface: '#FFFFFF',
  surfaceHover: '#F9FAFB',
  
  text: '#0B0B0D',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  
  border: '#D1D5DB',
  borderSubtle: '#E5E7EB',
  borderRadius: '8px',
  
  accent: '#7B5CFF',
  accentHover: '#6B4CE6',
  accentMuted: 'rgba(123, 92, 255, 0.1)',
  accentGlow: 'rgba(123, 92, 255, 0.2)',
  accentGold: '#6B4CE6',
  
  live: '#E14B4B',
  liveGlow: 'rgba(225, 75, 75, 0.2)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowStrong: 'rgba(0, 0, 0, 0.2)',
  overlay: 'rgba(255, 255, 255, 0.9)',
  glow: '0 0 20px rgba(123, 92, 255, 0.15)',
  
  // Named Colors
  signalWhite: '#F5F7FA',
  steelGray: '#D1D5DB',
  infraRed: '#E14B4B',
};
