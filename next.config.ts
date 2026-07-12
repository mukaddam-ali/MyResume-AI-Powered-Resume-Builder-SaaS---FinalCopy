import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling these server-side packages.
  // pdf-parse reads test files from disk and must be loaded natively, not bundled.
  serverExternalPackages: ["pdf-parse"],

  // Security headers — fixes Lighthouse Best Practices: CSP, HSTS, XFO, COOP, MIME, Permissions
  async headers() {
    // 'unsafe-inline' script-src is required by Next.js inline bootstrap scripts
    // (a nonce-based CSP needs middleware rewrites — upgrade later if needed).
    // 'unsafe-eval' is required by pdf.js font rendering in the live preview.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://js.stripe.com https://m.stripe.network",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
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
