import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coinbase/onchainkit'],
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
