import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * x402-protected order endpoint.
 *
 * Clients (customers, AI agents) must pay $0.01 USDC on Base mainnet
 * before this handler is invoked. The x402-next middleware in
 * src/middleware.ts intercepts the request, issues the 402 challenge,
 * verifies payment via the Coinbase facilitator, then forwards here.
 *
 * The X-PAYMENT-RESPONSE header set by the middleware contains the
 * verified transaction hash — proof of payment on Base mainnet.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { merchantId, items, customerNote } = req.body as {
    merchantId?: string;
    items?: { name: string; quantity: number; price: string }[];
    customerNote?: string;
  };

  if (!merchantId || !items?.length) {
    return res.status(400).json({ error: 'merchantId and items are required' });
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const paymentTx = req.headers['x-payment-response'] as string | undefined;

  console.log(`[x402] Order ${orderId} paid — tx: ${paymentTx ?? 'unknown'}, merchant: ${merchantId}`);

  return res.status(200).json({
    success: true,
    orderId,
    merchantId,
    items,
    customerNote: customerNote ?? '',
    paymentVerified: true,
    paymentTx: paymentTx ?? null,
    message: `Order confirmed for ${merchantId}. Payment verified on Base mainnet.`,
  });
}
