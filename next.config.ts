import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling these server-side packages.
  // pdf-parse reads test files from disk and must be loaded natively, not bundled.
  serverExternalPackages: ["pdf-parse"],

  webpack: (config, { isServer }) => {
    // Disable canvas and encoding aliases
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Handle pdfjs-dist worker and canvas dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }

    // Add rule to handle PDF.js worker files
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    });

    return config;
  },
  transpilePackages: ['react-pdf'],
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
