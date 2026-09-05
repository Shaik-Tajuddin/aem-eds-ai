import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: false,


  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
  // Proxy API calls to the Fastify backend
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
