/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://localhost:7202/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig

export default nextConfig;
