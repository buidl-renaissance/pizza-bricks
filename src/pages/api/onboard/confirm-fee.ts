import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import { ethers } from 'ethers';
import { getDb } from '@/db/drizzle';
import { vendorOnboardings } from '@/db/schema';

const BASE_MAINNET_RPC = 'https://mainnet.base.org';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const MIN_AMOUNT = BigInt(1_000_000); // 1 USDC (6 decimals)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, txHash } = req.body as { token?: string; txHash?: string };
  if (!txHash) return res.status(400).json({ error: 'txHash is required' });

  const agentWallet = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS;
  if (!agentWallet) return res.status(500).json({ error: 'Agent wallet not configured' });

  const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
  let receipt: ethers.TransactionReceipt | null = null;

  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch {
    return res.status(400).json({ error: 'Could not fetch transaction from Base mainnet' });
  }

  if (!receipt) {
    return res.status(400).json({ error: 'Transaction not found — may still be pending' });
  }

  if (receipt.to?.toLowerCase() !== USDC_BASE.toLowerCase()) {
    return res.status(400).json({ error: 'Transaction target is not the USDC contract on Base' });
  }

  const agentTopic = '0x000000000000000000000000' + agentWallet.slice(2).toLowerCase();
  const transferLog = receipt.logs.find(
    log =>
      log.address.toLowerCase() === USDC_BASE.toLowerCase() &&
      log.topics[0] === TRANSFER_TOPIC &&
      log.topics[2]?.toLowerCase() === agentTopic,
  );

  if (!transferLog) {
    return res.status(400).json({ error: 'No USDC transfer to Pizza Bricks agent wallet found in tx' });
  }

  const amount = BigInt(transferLog.data);
  if (amount < MIN_AMOUNT) {
    return res.status(400).json({ error: `Transfer amount too small: got ${amount} units, need ${MIN_AMOUNT}` });
  }

  // Demo mode — payment verified but no DB record needed
  if (!token || token === 'demo') {
    return res.status(200).json({ success: true, demo: true, amount: amount.toString() });
  }

  const db = getDb();

  const onboarding = await db
    .select()
    .from(vendorOnboardings)
    .where(eq(vendorOnboardings.onboardingToken, token))
    .then(r => r[0] || null);

  if (!onboarding) {
    return res.status(404).json({ error: 'Invalid onboarding token' });
  }

  const now = new Date();
  await db.update(vendorOnboardings).set({
    feeTxHash: txHash,
    feePaidAt: now,
    updatedAt: now,
  }).where(eq(vendorOnboardings.id, onboarding.id));

  return res.status(200).json({ success: true, amount: amount.toString() });
}
