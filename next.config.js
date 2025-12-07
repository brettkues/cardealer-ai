/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: true,
  },

  api: {
    responseLimit: "20mb",
    bodyParser: {
      sizeLimit: "15mb",
    },
  },

  webpack: (config) => {
    // Disable Node modules not available in Vercel Edge
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
};

module.exports = nextConfig;
