/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: true,
  },

  // Prevent micromatch infinite recursion on Vercel
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/.git/**', '**/.next/**', '**/node_modules/**']
    };
    return config;
  },
};

module.exports = nextConfig;
