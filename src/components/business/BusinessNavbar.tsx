import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { BUSINESS_NAVBAR } from "@/content/businessCopy";

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  backdrop-filter: blur(12px);
  background: ${({ theme }) => theme.background};
  opacity: 0.98;
`;

const Container = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: ${({ theme }) => theme.text};
  font-family: "Fredoka", "Space Grotesk", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const LogoEmoji = styled.span`
  font-size: 1.5rem;
`;

const Badge = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.surface};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
`;

const Nav = styled.nav`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const NavLink = styled.a`
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`;

const NavActions = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const CtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  background: ${({ theme }) => theme.accent};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  }
`;

const MenuButton = styled.button`
  display: flex;
  padding: 0.5rem;
  color: ${({ theme }) => theme.text};
  background: none;
  border: none;
  cursor: pointer;
  @media (min-width: 768px) {
    display: none;
  }
`;

const MenuIcon = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  span {
    display: block;
    width: 1.5rem;
    height: 2px;
    background: ${({ theme }) => theme.text};
  }
`;

const MobileMenu = styled.div`
  background: ${({ theme }) => theme.background};
  border-top: 1px solid ${({ theme }) => theme.border};
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)`
  display: block;
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  padding: 0.5rem 0;
  font-weight: 500;
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const MobileCta = styled(Link)`
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-family: "Space Grotesk", sans-serif;
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  background: ${({ theme }) => theme.accent};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  }
`;

export const BusinessNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Header>
      <Container>
        <LogoLink href="/">
          <LogoEmoji>🍕🧱</LogoEmoji>
          <span>{BUSINESS_NAVBAR.logo}</span>
          <Badge>{BUSINESS_NAVBAR.badge}</Badge>
        </LogoLink>

        <Nav>
          {BUSINESS_NAVBAR.nav.map((item) =>
            item.href.startsWith("#") ? (
              <NavLink key={item.label} href={item.href}>
                {item.label}
              </NavLink>
            ) : (
              <NavLink as={Link} key={item.label} href={item.href}>
                {item.label}
              </NavLink>
            )
          )}
        </Nav>

        <NavActions>
          <CtaButton href="/#join-pod">{BUSINESS_NAVBAR.cta}</CtaButton>
        </NavActions>

        <MenuButton type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <MenuIcon>
            <span />
            <span />
            <span />
          </MenuIcon>
        </MenuButton>
      </Container>

      {menuOpen && (
        <MobileMenu>
          <NavLink href="#agents" onClick={() => setMenuOpen(false)}>AI Agents</NavLink>
          <NavLink href="#activation" onClick={() => setMenuOpen(false)}>Activation</NavLink>
          <NavLink href="#how" onClick={() => setMenuOpen(false)}>How It Works</NavLink>
          <MobileNavLink href="/" onClick={() => setMenuOpen(false)}>Community</MobileNavLink>
          <MobileCta href="/#join-pod" onClick={() => setMenuOpen(false)}>{BUSINESS_NAVBAR.cta}</MobileCta>
        </MobileMenu>
      )}
    </Header>
  );
};
