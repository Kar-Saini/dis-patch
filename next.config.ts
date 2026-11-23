import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  outputFileTracingIncludes: {
    "/company/*/dispatch": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },

  webpack: (config) => {
    config.module.rules.push({ test: /\.html$/, type: "asset/source" });
    return config;
  },
};

export default nextConfig;
