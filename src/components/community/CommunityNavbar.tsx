import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { COMMUNITY_NAVBAR } from "@/content/communityCopy";

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
  &:hover {
    color: ${({ theme }) => theme.text};
    opacity: 0.9;
  }
`;

const Nav = styled.nav`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: 2rem;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: "Righteous", cursive;
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

const NavLinkInternal = styled(Link)`
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
  font-weight: 700;
  font-family: "Righteous", cursive;
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

const MobileLink = styled.a`
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
  font-weight: 700;
  font-family: "Righteous", cursive;
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  background: ${({ theme }) => theme.accent};
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  &:hover {
    background: ${({ theme }) => theme.accentHover};
    color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
  }
`;

export const CommunityNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Header>
      <Container>
        <LogoLink href="/">
          <Image
            src="/pizza-bricks.png"
            alt={COMMUNITY_NAVBAR.logo}
            width={140}
            height={36}
            priority
          />
        </LogoLink>

        <Nav>
          {COMMUNITY_NAVBAR.nav.map((item) =>
            item.href.startsWith("#") ? (
              <NavLink key={item.label} href={item.href}>
                {item.label}
              </NavLink>
            ) : (
              <NavLinkInternal key={item.label} href={item.href}>
                {item.label}
              </NavLinkInternal>
            )
          )}
        </Nav>

        <NavActions>
          <CtaButton href="/#join-pod">{COMMUNITY_NAVBAR.cta}</CtaButton>
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
          {COMMUNITY_NAVBAR.nav.map((item) => (
            item.href.startsWith("#") ? (
              <MobileLink key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</MobileLink>
            ) : (
              <MobileLink key={item.label} href={item.href} onClick={() => setMenuOpen(false)} as={Link}>{item.label}</MobileLink>
            )
          ))}
          <MobileCta href="/#join-pod" onClick={() => setMenuOpen(false)}>{COMMUNITY_NAVBAR.cta}</MobileCta>
        </MobileMenu>
      )}
    </Header>
  );
};
