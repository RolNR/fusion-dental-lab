import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    serverActions:   {
        bodySizeLimit: '100mb'
    }
  }
};

export default nextConfig;
