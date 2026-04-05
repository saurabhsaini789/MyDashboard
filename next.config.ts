import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled because API routes require a Node.js server
  basePath: '/my-dashboard',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
