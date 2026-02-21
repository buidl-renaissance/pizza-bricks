import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const Form = styled.form`
  max-width: 420px;
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

const Fieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0 0 0.5rem;
`;

const Legend = styled.legend`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.accent};
  margin-bottom: 0.75rem;
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

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 2px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  font-family: inherit;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;
  &:focus {
    border-color: ${({ theme }) => theme.accent};
    outline: none;
  }
  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }
`;

const Submit = styled.button`
  padding: 0.875rem 1.5rem;
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.onAccent ?? theme.signalWhite};
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

export interface CommunityReferBusinessFormProps {
  submitLabel?: string;
  successMessage?: string;
  onSuccess?: () => void;
}

export const CommunityReferBusinessForm: React.FC<CommunityReferBusinessFormProps> = ({
  submitLabel = "Submit referral",
  successMessage = "Thanks! We'll use this to reach out.",
  onSuccess,
}) => {
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [referrerEmail, setReferrerEmail] = useState("");
  const [referrerPhone, setReferrerPhone] = useState("");
  const [personalInterest, setPersonalInterest] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setStatus("error");
      setStatusMessage("Business name is required.");
      return;
    }
    if (!referrerName.trim()) {
      setStatus("error");
      setStatusMessage("Your name is required.");
      return;
    }
    if (!referrerEmail.trim()) {
      setStatus("error");
      setStatusMessage("Your email is required.");
      return;
    }
    if (!personalInterest.trim()) {
      setStatus("error");
      setStatusMessage("Please describe your connection to this business.");
      return;
    }

    setStatus("loading");
    setStatusMessage("");

    try {
      const res = await fetch("/api/community/refer-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim() || undefined,
          businessEmail: businessEmail.trim() || undefined,
          businessAddress: businessAddress.trim() || undefined,
          businessCity: businessCity.trim() || undefined,
          referrerName: referrerName.trim(),
          referrerEmail: referrerEmail.trim(),
          referrerPhone: referrerPhone.trim() || undefined,
          personalInterest: personalInterest.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setStatusMessage(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setStatusMessage(successMessage);
      setBusinessName("");
      setBusinessPhone("");
      setBusinessEmail("");
      setBusinessAddress("");
      setBusinessCity("");
      setReferrerName("");
      setReferrerEmail("");
      setReferrerPhone("");
      setPersonalInterest("");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
  };

  const disabled = status === "loading";

  return (
    <Form onSubmit={handleSubmit}>
      <Fieldset>
        <Legend>Business</Legend>
        <Row>
          <Label htmlFor="ref-business-name">Business name *</Label>
          <Input
            id="ref-business-name"
            type="text"
            placeholder="e.g. Tony's Pizzeria"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={disabled}
            autoComplete="organization"
          />
        </Row>
        <Row>
          <Label htmlFor="ref-business-phone">Business phone</Label>
          <Input
            id="ref-business-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            disabled={disabled}
          />
        </Row>
        <Row>
          <Label htmlFor="ref-business-email">Business email</Label>
          <Input
            id="ref-business-email"
            type="email"
            placeholder="contact@business.com"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            disabled={disabled}
          />
        </Row>
        <Row>
          <Label htmlFor="ref-business-address">Business address</Label>
          <Input
            id="ref-business-address"
            type="text"
            placeholder="123 Main St"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            disabled={disabled}
            autoComplete="street-address"
          />
        </Row>
        <Row>
          <Label htmlFor="ref-business-city">Business city</Label>
          <Input
            id="ref-business-city"
            type="text"
            placeholder="City"
            value={businessCity}
            onChange={(e) => setBusinessCity(e.target.value)}
            disabled={disabled}
            autoComplete="address-level2"
          />
        </Row>
      </Fieldset>

      <Fieldset>
        <Legend>Your info</Legend>
        <Row>
          <Label htmlFor="ref-your-name">Your name *</Label>
          <Input
            id="ref-your-name"
            type="text"
            placeholder="Your name"
            value={referrerName}
            onChange={(e) => setReferrerName(e.target.value)}
            disabled={disabled}
            autoComplete="name"
          />
        </Row>
        <Row>
          <Label htmlFor="ref-your-email">Your email *</Label>
          <Input
            id="ref-your-email"
            type="email"
            placeholder="you@example.com"
            value={referrerEmail}
            onChange={(e) => setReferrerEmail(e.target.value)}
            disabled={disabled}
            autoComplete="email"
          />
        </Row>
        <Row>
          <Label htmlFor="ref-your-phone">Your phone</Label>
          <Input
            id="ref-your-phone"
            type="tel"
            placeholder="(555) 987-6543"
            value={referrerPhone}
            onChange={(e) => setReferrerPhone(e.target.value)}
            disabled={disabled}
            autoComplete="tel"
          />
        </Row>
      </Fieldset>

      <Fieldset>
        <Legend>Your connection</Legend>
        <Row>
          <Label htmlFor="ref-interest">Personal interest / relationship *</Label>
          <Textarea
            id="ref-interest"
            placeholder="e.g. Regular customer, friend of owner, work nearby..."
            value={personalInterest}
            onChange={(e) => setPersonalInterest(e.target.value)}
            disabled={disabled}
          />
        </Row>
      </Fieldset>

      <Submit type="submit" disabled={disabled}>
        {status === "loading" ? "Submitting..." : submitLabel}
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
  );
};
