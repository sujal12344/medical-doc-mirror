import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "pdf-parse"],
};

export default nextConfig;
