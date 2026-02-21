import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@coinbase/onchainkit'],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
