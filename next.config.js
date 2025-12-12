/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Required for server-side image generation using Sharp
  experimental: {
    serverComponentsExternalPackages: ["sharp"]
  },

  // Do NOT include custom webpack fallbacks here.
  // Do NOT include custom "api" config blocks.
  // Do NOT include path fallbacks.
};

module.exports = nextConfig;
