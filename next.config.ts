import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' to enable server-side features (middleware, API routes)
  // This allows Cloudflare Pages Functions to work properly
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
