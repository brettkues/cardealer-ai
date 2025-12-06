/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: true,
    webpackBuildWorker: true
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pischkemotorsoflacrosse.com"
      },
      {
        protocol: "https",
        hostname: "**.pischkenissan.com"
      },
      {
        protocol: "https",
        hostname: "**.dealerinspire.com"
      },
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false
    };

    return config;
  }
};

module.exports = nextConfig;
