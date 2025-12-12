/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["sharp"],
  },

  // Completely disable Next.js file tracing to stop micromatch recursion
  output: "standalone",
  experimental: {
    ...(() => ({
      serverActions: true,
      serverComponentsExternalPackages: ["sharp"],
      // Disable tracing
      turbo: {
        rules: {},
      },
      // This prevents Next from scanning node_modules, .next, etc.
      disableOptimizedLoading: true,
      workerThreads: false,
    }))(),
  },

  webpack(config) {
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
