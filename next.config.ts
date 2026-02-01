import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
