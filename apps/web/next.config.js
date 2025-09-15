/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@our-line-in-time/shared', '@our-line-in-time/ui'],
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Bundle analysis configuration
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enable bundle analysis in production builds
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 1,
          maxSize: 244000, // ~240KB chunks to stay under 500KB total target
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig;