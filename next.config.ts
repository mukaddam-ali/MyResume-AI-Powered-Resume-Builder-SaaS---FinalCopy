import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling these server-side packages.
  // pdf-parse reads test files from disk and must be loaded natively, not bundled.
  serverExternalPackages: ["pdf-parse"],

  // Security headers — fixes Lighthouse Best Practices: XFO, COOP, MIME, Permissions
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

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
