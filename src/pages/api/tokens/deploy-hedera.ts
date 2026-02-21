import type { NextApiRequest, NextApiResponse } from 'next';
import {
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType,
} from '@hashgraph/sdk';
import {
  getHederaTestnetClient,
  getHederaTestnetClientFromCredentials,
  type HederaOperatorKeyType,
} from '@/lib/hedera-operator';

type RouteBody = {
  tokenName?: string;
  tokenSymbol?: string;
  initialSupply?: number;
  decimals?: number;
  operatorAccountId?: string;
  operatorPrivateKey?: string;
  operatorKeyType?: HederaOperatorKeyType;
  treasuryAccountId?: string;
  treasuryPrivateKey?: string;
};

type DeploySuccess = {
  success: true;
  contractAddress: string; // token ID, kept for UI compatibility
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  decimals: number;
  deployer: string;
  transactionHash: string | null;
  network: string;
  mirrorUrl: string;
  treasuryAccountId: string;
};

type DeployError = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeploySuccess | DeployError>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as RouteBody;
  const tokenName = body.tokenName?.trim();
  const tokenSymbol = body.tokenSymbol?.trim().toUpperCase();
  const initialSupply = Math.max(1, Math.floor(Number(body.initialSupply) || 10_000));
  const decimals = Math.min(8, Math.max(0, Math.floor(Number(body.decimals) || 2)));
  const operatorAccountIdRaw = body.operatorAccountId?.trim();
  const operatorPrivateKeyRaw = body.operatorPrivateKey?.trim().replace(/^0x/i, '') || undefined;
  const treasuryAccountIdRaw = body.treasuryAccountId?.trim();
  const treasuryPrivateKeyRaw = body.treasuryPrivateKey?.trim().replace(/^0x/i, '') || undefined;

  if (!tokenName || !tokenSymbol) {
    return res.status(400).json({ error: 'tokenName and tokenSymbol are required' });
  }

  if ((operatorAccountIdRaw && !operatorPrivateKeyRaw) || (!operatorAccountIdRaw && operatorPrivateKeyRaw)) {
    return res.status(400).json({
      error: 'Provide both operatorAccountId and operatorPrivateKey, or neither to use env credentials.',
    });
  }

  try {
    let client: ReturnType<typeof getHederaTestnetClient>['client'];
    let operatorId: string;

    if (operatorAccountIdRaw && operatorPrivateKeyRaw && /^0\.0\.\d+$/.test(operatorAccountIdRaw)) {
      const resolved = getHederaTestnetClientFromCredentials(
        operatorAccountIdRaw,
        operatorPrivateKeyRaw,
        body.operatorKeyType,
      );
      client = resolved.client;
      operatorId = resolved.operatorId;
    } else if (operatorAccountIdRaw) {
      return res.status(400).json({ error: 'operatorAccountId must be in the form 0.0.x' });
    } else {
      const resolved = getHederaTestnetClient();
      client = resolved.client;
      operatorId = resolved.operatorId;
    }

    const treasuryAccountId =
      treasuryAccountIdRaw && /^0\.0\.\d+$/.test(treasuryAccountIdRaw)
        ? treasuryAccountIdRaw
        : operatorId;
    const isCustomTreasury = treasuryAccountId !== operatorId;

    if (isCustomTreasury && !treasuryPrivateKeyRaw) {
      await client.close();
      return res.status(400).json({
        error:
          'When using a custom treasuryAccountId, treasuryPrivateKey is required so treasury can sign.',
      });
    }

    let treasuryKey: PrivateKey | undefined;
    if (treasuryPrivateKeyRaw) {
      if (treasuryPrivateKeyRaw.length === 64 && /^[a-fA-F0-9]+$/.test(treasuryPrivateKeyRaw)) {
        treasuryKey = PrivateKey.fromStringECDSA(treasuryPrivateKeyRaw);
      } else {
        treasuryKey = PrivateKey.fromStringDer(treasuryPrivateKeyRaw);
      }
    }

    const supplyKey = PrivateKey.generateECDSA();
    const adminKey = supplyKey;

    const tx = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setDecimals(decimals)
      .setInitialSupply(initialSupply)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(initialSupply)
      .setTreasuryAccountId(AccountId.fromString(treasuryAccountId))
      .setAdminKey(adminKey.publicKey)
      .setSupplyKey(supplyKey.publicKey)
      .setTokenMemo('Created via Pizza Bricks onboarding')
      .freezeWith(client);

    let signedTx = await tx.sign(adminKey);
    if (isCustomTreasury && treasuryKey) {
      signedTx = await signedTx.sign(treasuryKey);
    }

    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const tokenId = receipt.tokenId;
    await client.close();

    if (!tokenId) {
      throw new Error('Token creation did not return a token ID');
    }

    console.log(
      `[Hedera] Created HTS token "${tokenName}" (${tokenSymbol}) as ${tokenId.toString()} (tx: ${txResponse.transactionId?.toString() ?? 'n/a'})`,
    );

    return res.status(200).json({
      success: true,
      contractAddress: tokenId.toString(),
      tokenId: tokenId.toString(),
      tokenName,
      tokenSymbol,
      totalSupply: String(initialSupply),
      decimals,
      deployer: operatorId,
      transactionHash: txResponse.transactionId?.toString() ?? null,
      network: 'Hedera Testnet',
      treasuryAccountId,
      mirrorUrl: `https://testnet.mirrornode.hedera.com/api/v1/accounts/${treasuryAccountId}/tokens?token.id=${tokenId}`,
    });
  } catch (err) {
    console.error('[Hedera] Create token error:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (/INVALID_SIGNATURE/i.test(message)) {
      return res.status(400).json({
        error:
          'INVALID_SIGNATURE: Operator key does not match operator account. Set HEDERA_OPERATOR_KEY_TYPE=ed25519 or ecdsa, and ensure HEDERA_OPERATOR_KEY matches HEDERA_OPERATOR_ID.',
      });
    }
    return res.status(500).json({ error: `Token creation failed: ${message}` });
  }
}
