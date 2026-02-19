import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { supabase, type SignupType, type LandingSignupInsert } from "@/lib/supabase";

const Form = styled.form`
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  transition: border-color 0.2s;
  &:focus {
    border-color: ${({ theme }) => theme.accent};
    outline: none;
  }
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  input {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: ${({ theme }) => theme.accent};
  }
`;

const Submit = styled.button`
  padding: 0.875rem 1.5rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.signalWhite};
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;

const Message = styled(motion.p)<{ $error?: boolean }>`
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  margin: 0;
  color: ${({ theme, $error }) => ($error ? theme.danger : theme.success)};
`;

export interface WaitlistFormProps {
  type: SignupType;
  title?: string;
  fields?: "email" | "email-name" | "email-name-city" | "email-city";
  unityCheckbox?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
}

export const WaitlistForm: React.FC<WaitlistFormProps> = ({
  type,
  title,
  fields = "email",
  unityCheckbox = false,
  submitLabel = "Submit",
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [unityDev, setUnityDev] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!supabase) {
      setStatus("error");
      setStatusMessage("Signup is not configured. Add Supabase env vars.");
      return;
    }
    setStatus("loading");
    const insertType: SignupType = unityDev ? "unity_dev" : type;
    const row: LandingSignupInsert = {
      email: email.trim(),
      type: insertType,
    };
    if (fields.includes("name") && name.trim()) row.name = name.trim();
    if (fields.includes("city") && city.trim()) row.city = city.trim();
    if (message.trim()) row.message = message.trim();

    const { error } = await supabase.from("landing_signups").insert(row);

    if (error) {
      setStatus("error");
      setStatusMessage(error.message || "Something went wrong.");
      return;
    }
    setStatus("success");
    setStatusMessage("You're on the list. We'll be in touch.");
    setEmail("");
    setName("");
    setCity("");
    setMessage("");
    setUnityDev(false);
    onSuccess?.();
  };

  const showName = fields === "email-name" || fields === "email-name-city";
  const showCity = fields === "email-city" || fields === "email-name-city";

  return (
    <>
      {title && (
        <Label as="h3" style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>
          {title}
        </Label>
      )}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Label htmlFor="waitlist-email">Email</Label>
          <Input
            id="waitlist-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            autoComplete="email"
          />
        </Row>
        {showName && (
          <Row>
            <Label htmlFor="waitlist-name">Name</Label>
            <Input
              id="waitlist-name"
              type="text"
              placeholder="Your name or shop name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "loading"}
              autoComplete="name"
            />
          </Row>
        )}
        {showCity && (
          <Row>
            <Label htmlFor="waitlist-city">City</Label>
            <Input
              id="waitlist-city"
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={status === "loading"}
              autoComplete="address-level2"
            />
          </Row>
        )}
        {unityCheckbox && (
          <CheckboxRow>
            <input
              type="checkbox"
              checked={unityDev}
              onChange={(e) => setUnityDev(e.target.checked)}
              disabled={status === "loading"}
            />
            I'm a Unity dev / interested in building the game
          </CheckboxRow>
        )}
        <Submit type="submit" disabled={status === "loading"}>
          {status === "loading" ? "..." : submitLabel}
        </Submit>
        {status !== "idle" && (
          <Message
            $error={status === "error"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {statusMessage}
          </Message>
        )}
      </Form>
    </>
  );
};
