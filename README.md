# Pizza Bricks

**Pizza Bricks** is a location-based discovery game that transforms community participation into collective ownership — starting with pizza.

This is a [Next.js](https://nextjs.org) app in the Renaissance City ecosystem. The landing page (V1) converts visitors into email/Discord signups, early access testers, pizzeria partners, and Unity dev collaborators.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. The home page is the Pizza Bricks landing; use `/dashboard` or `/app` for the authenticated app.

Copy `env.example` to `.env.local` and set:

- **Database**: `USE_LOCAL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` for Drizzle/Turso.
- **Landing**: `NEXT_PUBLIC_DISCORD_INVITE` for the Discord CTA.
- **Waitlist**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for landing signups. Create the `landing_signups` table in Supabase (see SQL in `src/lib/supabase.ts`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
