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
      { source: '/projects', destination: '/dashboard/projects' },
      { source: '/projects/new', destination: '/dashboard/projects/new' },
      { source: '/projects/:id', destination: '/dashboard/projects/:id' },
      { source: '/runs', destination: '/dashboard/runs' },
      { source: '/runs/:id', destination: '/dashboard/runs/:id' },
      { source: '/activity', destination: '/dashboard/activity' },
      { source: '/tool-calls', destination: '/dashboard/tools' },
      { source: '/code-changes', destination: '/dashboard/code' },
      { source: '/tests', destination: '/dashboard/tests' },
      { source: '/visual-qa', destination: '/dashboard/visual' },
      { source: '/universal-editor', destination: '/dashboard/ue' },
      { source: '/bugs', destination: '/dashboard/bugs' },
      { source: '/deployments', destination: '/dashboard/deployments' },
      { source: '/llm-usage', destination: '/dashboard/usage' },
      { source: '/knowledge', destination: '/dashboard/knowledge' },
      { source: '/settings', destination: '/dashboard/settings' },
    ];
  },
};

export default nextConfig;
