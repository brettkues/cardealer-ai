/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  webpack(config, { isServer }) {
    // DEBUG: Print the directories Next.js is scanning
    console.log("WEBPACK CONTEXT:", config.context);
    console.log("RESOLVE MODULES:", config.resolve.modules);

    return config;
  },

  experimental: {
    serverActions: true,
    // DEBUG: This forces Next.js to spit out patterns before crashing
    outputFileTracingIncludes: {
      "/": ["./**/*"]
    }
  }
};

module.exports = nextConfig;
