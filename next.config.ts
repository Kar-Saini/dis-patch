import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  outputFileTracingIncludes: {
    "/companies/[slug]/dispatch": [
      "./template/**/*",
      "./public/new_template.html",
      "./node_modules/@sparticuz/chromium/bin/**/*",
      "./node_modules/.pnpm/@sparticuz+chromium*/node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
};

export default nextConfig;
