import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Photo uploads pass through a server action on their way to the API (which allows 10 MB).
    serverActions: { bodySizeLimit: '11mb' },
  },
};

export default nextConfig;
