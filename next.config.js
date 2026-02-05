/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  basePath: '/buwen',
  // 支持树莓派部署
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
