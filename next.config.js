/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Vercel image + API settings for Sharp & vehicle image processing
  experimental: {
    serverActions: true,
  },

  // Required for large images (collage, scraping, logo uploads)
  api: {
    responseLimit: "20mb",
    bodyParser: {
      sizeLimit: "15mb",
    },
  },

  // Fixes issues with sharp + wasm imports on Vercel
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
