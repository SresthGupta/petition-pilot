import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // pdfjs-dist uses canvas for Node.js rendering, not needed in browser
      canvas: { browser: "./src/lib/empty-module.ts" },
    },
  },
};

export default nextConfig;
