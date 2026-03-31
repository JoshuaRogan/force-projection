import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fp/shared', '@fp/engine', '@fp/simulation'],
};

export default nextConfig;
