import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8001';
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
