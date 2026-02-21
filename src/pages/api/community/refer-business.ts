import type { NextApiRequest, NextApiResponse } from "next";
import { insertProspect } from "@/db/ops";

interface ReferBusinessBody {
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessCity?: string;
  referrerName?: string;
  referrerEmail?: string;
  referrerPhone?: string;
  personalInterest?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = (req.body ?? {}) as ReferBusinessBody;

    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
    const referrerName = typeof body.referrerName === "string" ? body.referrerName.trim() : "";
    const referrerEmail = typeof body.referrerEmail === "string" ? body.referrerEmail.trim() : "";
    const personalInterest = typeof body.personalInterest === "string" ? body.personalInterest.trim() : "";

    if (!businessName) {
      return res.status(400).json({ error: "Business name is required" });
    }
    if (!referrerName) {
      return res.status(400).json({ error: "Your name is required" });
    }
    if (!referrerEmail) {
      return res.status(400).json({ error: "Your email is required" });
    }
    if (!personalInterest) {
      return res.status(400).json({ error: "Please describe your connection to this business" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referrerEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const businessPhone = typeof body.businessPhone === "string" ? body.businessPhone.trim() : undefined;
    const businessEmail = typeof body.businessEmail === "string" ? body.businessEmail.trim() : undefined;
    const businessAddress = typeof body.businessAddress === "string" ? body.businessAddress.trim() : undefined;
    const businessCity = typeof body.businessCity === "string" ? body.businessCity.trim() : undefined;
    const referrerPhone = typeof body.referrerPhone === "string" ? body.referrerPhone.trim() : undefined;

    await insertProspect({
      name: businessName,
      type: "pizzeria",
      contactName: referrerName,
      email: businessEmail || undefined,
      phone: businessPhone || undefined,
      address: businessAddress || undefined,
      city: businessCity || undefined,
      source: "referral",
      metadata: {
        referrerEmail,
        referrerPhone: referrerPhone || undefined,
        personalInterest,
      },
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("[refer-business] Error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
