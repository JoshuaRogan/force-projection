import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fp/shared', '@fp/engine', '@fp/simulation'],
  webpack(config) {
    // Point internal package imports directly at TypeScript source so the
    // dev server watches source files instead of compiled dist/ output.
    // Without this, changes to shared/engine/simulation require restarting
    // the dev server (or tsc --watch rebuilding dist/ mid-hot-reload).
    config.resolve.alias = {
      ...config.resolve.alias,
      '@fp/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@fp/engine': path.resolve(__dirname, '../engine/src/index.ts'),
      '@fp/simulation': path.resolve(__dirname, '../simulation/src/index.ts'),
    };

    // The source files use Node16-style .js extensions on relative imports
    // (e.g. import from './foo.js'). Tell webpack to resolve .js → .ts so
    // it finds the TypeScript source rather than a missing compiled file.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };

    return config;
  },
};

export default nextConfig;
