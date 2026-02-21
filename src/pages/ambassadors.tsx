import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { pizzaLandingTheme } from "@/styles/theme";
import { CommunityNavbar } from "@/components/community/CommunityNavbar";

const ROLES = [
  { value: "photographer", label: "Photographer" },
  { value: "influencer", label: "Influencer" },
  { value: "ambassador", label: "Ambassador" },
  { value: "repeat_customer", label: "Repeat customer" },
  { value: "referral_leader", label: "Community organizer" },
];

const PageWrap = styled.main`
  min-height: 100vh;
  width: 100%;
  padding-top: 4rem;
`;

const Section = styled.section`
  padding: clamp(3rem, 8vw, 5rem) 1.5rem;
  max-width: 480px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-family: "Righteous", cursive;
  font-weight: 900;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  color: ${({ theme }) => theme.text};
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  font-family: "Righteous", cursive;
  font-size: 1rem;
  color: ${({ theme }) => theme.textSecondary};
  margin: 0 0 2rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormRow = styled.div``;

const Label = styled.label`
  display: block;
  font-family: "Righteous", cursive;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0.375rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: "Righteous", cursive;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.accent};
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: "Righteous", cursive;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.accent};
    outline: none;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 88px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: "Righteous", cursive;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  resize: vertical;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.accent};
    outline: none;
  }
`;

const Submit = styled.button`
  padding: 1rem 1.5rem;
  font-family: "Righteous", cursive;
  font-weight: 800;
  font-size: 1rem;
  color: ${({ theme }) => theme.onAccent ?? "#fff"};
  background: ${({ theme }) => theme.accent};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  transition: background 0.2s;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Message = styled.p<{ $error?: boolean }>`
  font-size: 0.95rem;
  margin: 0;
  color: ${({ theme, $error }) => ($error ? theme.danger : theme.success)};
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 1.5rem;
  font-family: "Righteous", cursive;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default function AmbassadorsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<string>("ambassador");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus("loading");
    setStatusMessage("");
    try {
      const res = await fetch("/api/ambassador-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          city: city.trim() || undefined,
          role,
          instagramHandle: instagramHandle.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setStatusMessage(data.error || "Something went wrong.");
        return;
      }
      setStatus("success");
      setStatusMessage("You're on the list. We'll be in touch soon.");
      setName("");
      setEmail("");
      setCity("");
      setInstagramHandle("");
      setMessage("");
    } catch {
      setStatus("error");
      setStatusMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>Become a Local Creator | Pizza Bricks</title>
        <meta
          name="description"
          content="Join as a local creator — photographer, influencer, ambassador, or community organizer. Get matched with campaigns and opportunities in your city."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <ThemeProvider theme={pizzaLandingTheme}>
        <div style={{ minHeight: "100vh", background: pizzaLandingTheme.background }}>
          <CommunityNavbar />
          <PageWrap>
            <Section>
              <Title>Become a Local Creator</Title>
              <Subtitle>
                Join the network. Get matched with pizza parties, tastings, and campaigns in your city. Photographers, influencers, ambassadors, and community organizers welcome.
              </Subtitle>
              <Form onSubmit={handleSubmit}>
                <FormRow>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </FormRow>
                <FormRow>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </FormRow>
                <FormRow>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Detroit"
                  />
                </FormRow>
                <FormRow>
                  <Label htmlFor="role">I am a</Label>
                  <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </FormRow>
                <FormRow>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@handle"
                  />
                </FormRow>
                <FormRow>
                  <Label htmlFor="message">Why you want to join (optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="A sentence or two about you and what you're looking for."
                  />
                </FormRow>
                {statusMessage && (
                  <Message $error={status === "error"}>{statusMessage}</Message>
                )}
                <Submit type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "Submitting…" : "Join the network"}
                </Submit>
              </Form>
              <BackLink href="/">← Back to home</BackLink>
            </Section>
          </PageWrap>
        </div>
      </ThemeProvider>
    </>
  );
}
