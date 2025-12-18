import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Enable if you're using server actions
    serverActions: {
      allowedOrigins: ['localhost:3000', '0.0.0.0:3000']
    }
  }
};

export default nextConfig;
