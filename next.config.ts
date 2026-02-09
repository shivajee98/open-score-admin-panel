import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/admin',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // rewrites are not supported in static export
  reactCompiler: true,
};

export default nextConfig;
