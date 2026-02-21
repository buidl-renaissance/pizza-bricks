import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { compileERC20 } from '@/lib/compile-contract';

// Hedera JSON-RPC relay — EVM-compatible endpoint for Hedera Mainnet
const HEDERA_MAINNET_RPC = 'https://mainnet.hashio.io/api';

type DeploySuccess = {
  success: true;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  decimals: number;
  deployer: string;
  transactionHash: string | null;
  network: string;
  rpcUrl: string;
};

type DeployError = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeploySuccess | DeployError>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenName, tokenSymbol } = req.body as {
    tokenName?: string;
    tokenSymbol?: string;
  };

  if (!tokenName || !tokenSymbol) {
    return res.status(400).json({ error: 'tokenName and tokenSymbol are required' });
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: 'DEPLOYER_PRIVATE_KEY is not configured on the server' });
  }

  try {
    const { abi, bytecode } = compileERC20();

    const provider = new ethers.JsonRpcProvider(HEDERA_MAINNET_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(tokenName, tokenSymbol);
    const receipt = await contract.deploymentTransaction()?.wait();
    if (!receipt || !receipt.contractAddress) throw new Error('Deployment receipt missing contract address');

    const contractAddress = receipt.contractAddress;
    const txHash = contract.deploymentTransaction()?.hash ?? null;

    console.log(`[Hedera] Deployed ERC20 "${tokenName}" (${tokenSymbol}) at ${contractAddress} (tx: ${txHash})`);

    return res.status(200).json({
      success: true,
      contractAddress,
      tokenName,
      tokenSymbol,
      totalSupply: '10000',
      decimals: 18,
      deployer: wallet.address,
      transactionHash: txHash,
      network: 'Hedera Mainnet',
      rpcUrl: HEDERA_MAINNET_RPC,
    });
  } catch (err) {
    console.error('[Hedera] Deploy token error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `Deployment failed: ${message}` });
  }
}
