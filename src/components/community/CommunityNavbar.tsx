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

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
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

const ForBusinessesLink = styled(NavLinkInternal)`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: "Righteous", cursive;
  color: #FFFFFF;
  background: #E85D5D;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(232, 93, 93, 0.35);
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #D44D4D;
    box-shadow: 0 6px 18px rgba(232, 93, 93, 0.4);
    color: #FFFFFF;
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

export const CommunityNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Header>
      <Container>
        <LeftGroup>
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
          {COMMUNITY_NAVBAR.nav
            .filter((item) => item.href !== "/business")
            .map((item) =>
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
        </LeftGroup>

        <NavActions>
          <ForBusinessesLink href="/business">for Businesses</ForBusinessesLink>
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
          {COMMUNITY_NAVBAR.nav
            .filter((item) => item.href !== "/business")
            .map((item) =>
              item.href.startsWith("#") ? (
                <MobileLink key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</MobileLink>
              ) : (
                <MobileLink key={item.label} href={item.href} onClick={() => setMenuOpen(false)} as={Link}>{item.label}</MobileLink>
              )
            )}
          <ForBusinessesLink href="/business" onClick={() => setMenuOpen(false)}>
            for Businesses
          </ForBusinessesLink>
        </MobileMenu>
      )}
    </Header>
  );
};
