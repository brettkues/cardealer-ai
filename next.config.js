/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    webpackBuildWorker: true, // VALID
  },

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
