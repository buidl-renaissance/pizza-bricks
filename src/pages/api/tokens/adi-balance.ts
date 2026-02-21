import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Switch back to mainnet ('https://rpc.adifoundation.ai') when ready for production
const ADI_RPC = process.env.ADI_RPC_URL ?? 'https://rpc.ab.testnet.adifoundation.ai/';

type BalanceResponse = {
  address: string;
  balance: string;      // formatted, e.g. "1.234"
  balanceRaw: string;   // wei as string
  network: string;
  rpcUrl: string;
};

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceResponse | ErrorResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: 'DEPLOYER_PRIVATE_KEY is not configured' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(ADI_RPC);
    const wallet = new ethers.Wallet(privateKey);
    const balanceRaw = await provider.getBalance(wallet.address);

    return res.status(200).json({
      address: wallet.address,
      balance: parseFloat(ethers.formatEther(balanceRaw)).toFixed(6),
      balanceRaw: balanceRaw.toString(),
      network: process.env.ADI_RPC_URL ? 'ADI Network Mainnet' : 'ADI Network AB Testnet',
      rpcUrl: ADI_RPC,
    });
  } catch (err) {
    console.error('[ADI] Balance fetch error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `Failed to fetch balance: ${message}` });
  }
}
