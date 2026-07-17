import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'godii.top:3000',
        'http://godii.top:3000',
        'https://godii.top:3000',
        'godii.top:8434',
        'http://godii.top:8434',
        'https://godii.top:8434',
        'godii.top',
        'www.godii.top',
        'http://godii.top',
        'https://godii.top'
      ],
    },
  },
};

export default nextConfig;
