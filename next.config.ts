import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/adapter-pg', 'bcryptjs'],
  env: {
    AUTH_TRUST_HOST: 'true',
  },
};

export default nextConfig;
