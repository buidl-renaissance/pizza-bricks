import { AccountId, Client, PrivateKey } from '@hashgraph/sdk';

export type HederaOperatorKeyType = 'ed25519' | 'ecdsa' | 'der';

function parsePrivateKey(rawKey: string, keyType: HederaOperatorKeyType = 'ecdsa'): PrivateKey {
  const normalized = rawKey.trim().replace(/^0x/i, '');

  if (!normalized) {
    throw new Error('Operator private key is empty');
  }

  if (keyType === 'der') {
    return PrivateKey.fromStringDer(normalized);
  }

  if (keyType === 'ed25519') {
    return PrivateKey.fromStringED25519(normalized);
  }

  return PrivateKey.fromStringECDSA(normalized);
}

export function getHederaTestnetClientFromCredentials(
  operatorAccountId: string,
  operatorPrivateKey: string,
  operatorKeyType?: HederaOperatorKeyType,
) {
  const keyType = operatorKeyType ?? 'ecdsa';
  const accountId = AccountId.fromString(operatorAccountId);
  const privateKey = parsePrivateKey(operatorPrivateKey, keyType);
  const client = Client.forTestnet().setOperator(accountId, privateKey);

  return {
    client,
    operatorId: accountId.toString(),
  };
}

export function getHederaTestnetClient() {
  const operatorAccountId = process.env.HEDERA_OPERATOR_ID;
  const operatorPrivateKey = process.env.HEDERA_OPERATOR_KEY;
  const operatorKeyType = (process.env.HEDERA_OPERATOR_KEY_TYPE ?? 'ecdsa').toLowerCase() as HederaOperatorKeyType;

  if (!operatorAccountId || !operatorPrivateKey) {
    throw new Error(
      'Missing Hedera operator env vars. Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY.',
    );
  }

  if (!['ed25519', 'ecdsa', 'der'].includes(operatorKeyType)) {
    throw new Error('HEDERA_OPERATOR_KEY_TYPE must be one of: ed25519, ecdsa, der');
  }

  return getHederaTestnetClientFromCredentials(
    operatorAccountId.trim(),
    operatorPrivateKey.trim(),
    operatorKeyType,
  );
}
