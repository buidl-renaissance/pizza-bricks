import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { getAgenticCostSummary, getTickFinanceSummary } from '@/db/ops';

const BASE_RPC = 'https://mainnet.base.org';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = ['function balanceOf(address) view returns (uint256)'];

// $0.01 USDC per vendor onboarding fee (1 cent)
const ONBOARDING_FEE_USD = 0.01;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const agentWallet = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS;

  const [aiSummary, tickFinance] = await Promise.all([
    getAgenticCostSummary(),
    getTickFinanceSummary(),
  ]);

  // Live USDC balance from Base mainnet
  let walletBalanceUsdc = '0.00';
  if (agentWallet) {
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const usdc = new ethers.Contract(USDC_BASE, USDC_ABI, provider);
      const raw: bigint = await usdc.balanceOf(agentWallet);
      walletBalanceUsdc = (Number(raw) / 1_000_000).toFixed(2);
    } catch (err) {
      console.warn('[finance/summary] Could not fetch USDC balance:', err);
    }
  }

  return res.status(200).json({
    walletBalanceUsdc,
    agentWallet: agentWallet ?? null,
    totalAiCostUsd: aiSummary.totalCostUsd.toFixed(4),
    totalInputTokens: aiSummary.totalInputTokens,
    totalOutputTokens: aiSummary.totalOutputTokens,
    revenueVendorFees: tickFinance.revenueVendorFees,
  });
}
