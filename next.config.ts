import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Skip static generation during build when database is not available
  trailingSlash: false,
  experimental: {
    // Enable if you're using server actions
    serverActions: {
      allowedOrigins: ['localhost:3000', '0.0.0.0:3000']
    }
  },
  // Skip static optimization for pages that require database connections
  ...(process.env.SKIP_BUILD_STATIC_GENERATION === 'true' && {
    exportPathMap: async function () {
      return {
        '/': { page: '/' }
      };
    }
  })
};

export default nextConfig;
