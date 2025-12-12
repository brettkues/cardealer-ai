/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Disable all tracing so Vercel cannot recurse into node_modules
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["sharp"],
    outputFileTracingRoot: undefined,
    outputFileTracing: false,
    turbo: false,
  },

  // Completely stop Next.js from analyzing dependencies
  output: "standalone",

  // Override Webpack to prevent micromatch recursion
  webpack(config) {
    config.externals = [...config.externals, "micromatch"];
    config.snapshot = { managedPaths: [], immutablePaths: [] };
    return config;
  },

  api: {
    responseLimit: "20mb",
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

module.exports = nextConfig;
