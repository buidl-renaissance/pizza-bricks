'use client';

import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { base } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';
import { wrapFetchWithPayment, x402Client } from '@x402/fetch';
import { toClientEvmSigner } from '@x402/evm';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const basePublicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Returns a fetch function that automatically handles 402 Payment Required
 * by signing and attaching payment (USDC on Base) when the connected wallet is available.
 * When wallet is not connected, returns undefined so callers can fall back to regular fetch.
 */
export function useFetchWithPayment(): ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | null {
  const { data: walletClient } = useWalletClient({ chainId: base.id });

  return useMemo(() => {
    if (!walletClient?.account) return null;
    const account = walletClient.account;
    const signer = toClientEvmSigner(
      {
        address: account.address,
        signTypedData: (message) =>
          walletClient.signTypedData({
            account,
            domain: message.domain as Parameters<typeof walletClient.signTypedData>[0]['domain'],
            types: message.types as Parameters<typeof walletClient.signTypedData>[0]['types'],
            primaryType: message.primaryType as Parameters<typeof walletClient.signTypedData>[0]['primaryType'],
            message: message.message as Parameters<typeof walletClient.signTypedData>[0]['message'],
          }),
      },
      basePublicClient
    );
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });
    return wrapFetchWithPayment(fetch, client);
  }, [walletClient]);
}
