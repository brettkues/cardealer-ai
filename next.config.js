/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["sharp"],
  },

  // Prevent micromatch infinite recursion crash on Vercel
  webpack(config) {
    config.snapshot = {
      managedPaths: [],
      immutablePaths: [],
    };
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
