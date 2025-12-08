/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "/__/auth/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
