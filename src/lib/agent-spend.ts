/**
 * Autonomous on-chain USDC micro-payment from the agent wallet.
 *
 * Each agent tick triggers a small USDC transfer on Base mainnet as proof that
 * the agent autonomously spends its revenue to fund operations (marketing
 * campaign disbursements, API compute costs, etc.).
 *
 * The transaction calldata is attributed with an ERC-8021 builder code suffix,
 * so every autonomous outflow is trackable via Base's indexers.
 */

import { ethers } from 'ethers';
import { appendBuilderCode } from './builder-code';

const BASE_MAINNET_RPC = 'https://mainnet.base.org';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
];

// $0.001 USDC per tick (1000 USDC atoms / 6 decimals = 0.001 USDC)
const SPEND_AMOUNT = BigInt(1000);

export interface AgentSpendResult {
  txHash: string;
  amountUsdc: string;
}

/**
 * Send a tiny USDC payment from the agent wallet to the marketing treasury
 * (defaults to the same agent wallet if MARKETING_TREASURY_ADDRESS is not set).
 * Includes ERC-8021 builder code attribution.
 */
export async function autonomousAgentSpend(): Promise<AgentSpendResult | null> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.warn('[agent-spend] DEPLOYER_PRIVATE_KEY not set — skipping on-chain spend');
    return null;
  }

  const recipient = (
    process.env.MARKETING_TREASURY_ADDRESS ??
    process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ??
    ''
  ) as `0x${string}`;

  if (!recipient) {
    console.warn('[agent-spend] No recipient address configured — skipping on-chain spend');
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    const usdc = new ethers.Contract(USDC_BASE, USDC_ABI, wallet);

    // Check balance first — skip if agent wallet can't afford it
    const balance: bigint = await usdc.balanceOf(wallet.address);
    if (balance < SPEND_AMOUNT * BigInt(10)) {
      console.warn('[agent-spend] Insufficient USDC balance — skipping this tick');
      return null;
    }

    // Build transfer calldata and append ERC-8021 builder code
    const iface = new ethers.Interface(USDC_ABI);
    const rawCalldata = iface.encodeFunctionData('transfer', [recipient, SPEND_AMOUNT]);
    const attributedCalldata = appendBuilderCode(rawCalldata);

    const tx = await wallet.sendTransaction({
      to: USDC_BASE,
      data: attributedCalldata,
    });

    const receipt = await tx.wait();
    console.log(`[agent-spend] Autonomous spend tx: ${tx.hash} (${receipt?.status === 1 ? 'confirmed' : 'failed'})`);

    return {
      txHash: tx.hash,
      amountUsdc: (Number(SPEND_AMOUNT) / 1_000_000).toFixed(6),
    };
  } catch (err) {
    console.error('[agent-spend] Error during autonomous spend:', err);
    return null;
  }
}
