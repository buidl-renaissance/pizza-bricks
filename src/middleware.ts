import { paymentMiddleware } from 'x402-next';
import { facilitator } from '@coinbase/x402';

const AGENT_WALLET = (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS ?? '0x84D2D6536fE3553C537233160F3611a794b18D13') as `0x${string}`;

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
  },
  facilitator,
);

export const config = {
  matcher: ['/api/merchant/order'],
  runtime: 'nodejs',
};
