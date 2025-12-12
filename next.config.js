/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ["sharp"]    // REQUIRED FOR VERCEL
  },

  api: {
    responseLimit: "20mb",
    bodyParser: {
      sizeLimit: "15mb"
    }
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };

    return config;
  }
};

module.exports = nextConfig;
