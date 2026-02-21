import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coinbase/onchainkit'],
  async rewrites() {
    return [{ source: '/agent.json', destination: '/api/agent.json' }];
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pizzadao.github.io',
        port: '',
        pathname: '/pizzadao-brand-kit/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
