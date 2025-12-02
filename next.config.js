/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  api: {
    responseLimit: "20mb",
    bodyParser: {
      sizeLimit: "15mb",
    },
  },

  // Force Node.js runtime for all API routes (needed for Stripe, Firebase, scraping)
  experimental: {
    serverMinify: false,
  },

  webpack: (config) => {
    // Remove Node polyfills that are unnecessary in Vercel
    config.resolve.fallback = {
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
