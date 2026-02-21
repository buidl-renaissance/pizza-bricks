import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * ERC-8004 agent registration file.
 * Served at /agent.json (via rewrite) — referenced as the agentURI when registering
 * the Pizza Bricks agent in the Identity Registry on Base mainnet.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const host = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pizza-bricks.vercel.app';
  const agentWallet = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ?? '';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  return res.status(200).json({
    type: 'erc8004/registration/v1',
    name: 'Pizza Bricks Agent',
    description:
      'Autonomous AI agent that discovers local restaurants, builds their websites, deploys loyalty tokens, and manages vendor outreach — all onchain on Base.',
    image: `${host}/logo.png`,
    agentWallet,
    services: [
      {
        type: 'https',
        endpoint: `${host}/api/merchant/order`,
        description: 'x402-protected order endpoint — accepts USDC payments on Base mainnet',
      },
      {
        type: 'https',
        endpoint: `${host}/api/ops/sites/:id/update`,
        description: 'x402-protected website update — $0.50 USDC on Base per prompt-based site update (POST)',
      },
      {
        type: 'https',
        endpoint: `${host}/api/campaigns/:id/activate`,
        description: 'x402-protected campaign deployment — $1.00 USDC on Base per campaign activation (POST)',
      },
      {
        type: 'https',
        endpoint: `${host}/onboard`,
        description: 'Vendor onboarding flow with ERC-8021 attributed activation fee',
      },
    ],
    supportedTrust: ['reputation'],
    registrations: [],
  });
}
