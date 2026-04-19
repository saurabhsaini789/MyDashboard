import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/my-dashboard',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
