
/* eslint-disable */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Cloudflare Pages has no image optimizer — /_next/image is an uncached
    // passthrough there. Route everything through our own loader instead.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },

  // Enable compression
  compress: true,

  // Optimize production builds
  swcMinify: true,

  // Performance monitoring
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components/ui'],
  },

  // Add headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
