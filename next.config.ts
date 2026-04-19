import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Removed to enable SSR and Middleware for Supabase Auth
  // basePath: '/my-dashboard',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
