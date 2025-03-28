import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@uiw/react-md-editor": "@uiw/react-md-editor/dist/mdeditor.js",
    };
    return config;
  },
  transpilePackages: ["@uiw/react-md-editor"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ];
  }
};

export default nextConfig;
