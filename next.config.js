/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ["@napi-rs/canvas"]
  }
};

module.exports = nextConfig;
