/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
  },
  webpack(config) {
    config.externals = config.externals || [];
    return config;
  },
};

module.exports = nextConfig;
