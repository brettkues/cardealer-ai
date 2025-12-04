/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: true,
    webpackBuildWorker: true
  }
};

module.exports = nextConfig;
