/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Enable build worker so Vercel doesn’t choke on custom webpack
  experimental: {
    webpackBuildWorker: true,
  },

  // Allow Node.js APIs inside /app/api/* routes
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
