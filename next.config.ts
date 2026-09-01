import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for EC2 deployment via PM2 Standalone runner
  output: process.env.VERCEL ? undefined : "standalone",

  turbopack: {
    root: __dirname,
  },

  // Retain only valid CommonJS/native binary server packages here
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse", "tesseract.js"],
};

export default nextConfig;
