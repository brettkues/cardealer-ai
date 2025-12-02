/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Needed for your API routes (scraper, collage, chat, stripe)
  api: {
    responseLimit: "20mb",
    bodyParser: {
      sizeLimit: "15mb",
    },
  },

  // Next 14: remove deprecated serverActions
  experimental: {
    serverMinify: false,
  },

  // Prevent Vercel build errors with Node polyfills
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
