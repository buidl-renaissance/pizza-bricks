import { paymentMiddleware } from 'x402-next';
import { facilitator } from '@coinbase/x402';

const AGENT_WALLET = (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ?? '0x84D2D6536fE3553C537233160F3611a794b18D13') as `0x${string}`;

type FacilitatorParam = Parameters<typeof paymentMiddleware>[2];
export const middleware = paymentMiddleware(
  AGENT_WALLET,
  {
    '/api/merchant/order': {
      price: '$0.01',
      network: 'base',
      config: {
        description: 'Pizza Bricks — place an order with your merchant',
      },
    },
    '/api/ops/sites/[id]/update': {
      price: '$0.50',
      network: 'base',
      config: {
        description: 'Pizza Bricks — prompt-based website update',
      },
    },
    '/api/campaigns/[id]/activate': {
      price: '$0.25',
      network: 'base',
      config: {
        description: 'Pizza Bricks — campaign activation (deployment)',
      },
    },
  },
  facilitator as FacilitatorParam,
);

export const config = {
  matcher: [
    '/api/merchant/order',
    '/api/ops/sites/:path*',
    '/api/campaigns/:path*',
  ],
  runtime: 'nodejs',
};
