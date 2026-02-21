import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

const IDENTITY_REGISTRY_BASE = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const BASE_MAINNET_RPC = 'https://mainnet.base.org';

const REGISTRY_ABI = [
  'function register(string agentURI) returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

type RegisterSuccess = {
  success: true;
  agentId: string;
  txHash: string;
  agentURI: string;
  basescanUrl: string;
};

type RegisterError = { error: string };

type AlreadyRegistered = {
  alreadyRegistered: true;
  agentId: string;
  agentURI: string;
  basescanUrl: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterSuccess | RegisterError | AlreadyRegistered>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: 'DEPLOYER_PRIVATE_KEY not configured' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pizza-bricks.vercel.app';
  const agentURI = `${appUrl}/agent.json`;

  try {
    const rpcUrl = process.env.BASE_MAINNET_RPC_URL ?? BASE_MAINNET_RPC;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const registry = new ethers.Contract(IDENTITY_REGISTRY_BASE, REGISTRY_ABI, wallet);

    // Check if already registered (non-fatal: some RPCs/proxies return CALL_EXCEPTION with no revert data)
    try {
      const balance: bigint = await registry.balanceOf(wallet.address);
      if (balance > 0n) {
        const agentId: bigint = await registry.tokenOfOwnerByIndex(wallet.address, 0);
        const existingURI: string = await registry.tokenURI(agentId);
        return res.status(200).json({
          alreadyRegistered: true,
          agentId: agentId.toString(),
          agentURI: existingURI,
          basescanUrl: `https://basescan.org/token/${IDENTITY_REGISTRY_BASE}?a=${agentId.toString()}`,
        });
      }
    } catch (checkErr) {
      console.warn('[ERC-8004] Already-registered check failed (proceeding to register):', checkErr instanceof Error ? checkErr.message : checkErr);
    }

    console.log(`[ERC-8004] Registering agent with URI: ${agentURI}`);
    const tx = await registry.register(agentURI);
    const receipt = await tx.wait();

    // Parse agentId from Transfer event (ERC-721 mint: from=0x0)
    const transferIface = new ethers.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    ]);
    let agentId = '0';
    for (const log of receipt.logs) {
      try {
        const parsed = transferIface.parseLog(log);
        if (parsed && parsed.args.from === ethers.ZeroAddress) {
          agentId = parsed.args.tokenId.toString();
          break;
        }
      } catch { /* not this log */ }
    }

    console.log(`[ERC-8004] Registered agent — ID: ${agentId}, tx: ${tx.hash}`);

    return res.status(200).json({
      success: true,
      agentId,
      txHash: tx.hash,
      agentURI,
      basescanUrl: `https://basescan.org/tx/${tx.hash}`,
    });
  } catch (err) {
    console.error('[ERC-8004] Registration error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `Registration failed: ${message}` });
  }
}
