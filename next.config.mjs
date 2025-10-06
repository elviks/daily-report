/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize for production
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  // Add timeout configuration
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mongodb');
    }
    return config;
  },
}

export default nextConfig
