/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_DOMAIN_URL || 'localhost',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_DOMAIN_URL || 'localhost',
      },
    ],
    unoptimized: true,
  },
}

export default nextConfig
