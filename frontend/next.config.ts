import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@uiw/react-md-editor": "@uiw/react-md-editor/dist/mdeditor.js",
    };
    return config;
  },
  transpilePackages: ["@uiw/react-md-editor"]
};

export default nextConfig;
