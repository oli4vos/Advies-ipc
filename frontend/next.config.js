const path = require('path')

const isGithubPages = process.env.GITHUB_ACTIONS === 'true'
const repository = 'Advies-ipc'
const localOnly = isGithubPages
  ? {}
  : {
      async rewrites() {
        return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }]
      },
    }

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGithubPages ? { output: 'export' } : {}),
  trailingSlash: true,
  basePath: isGithubPages ? `/${repository}` : '',
  assetPrefix: isGithubPages ? `/${repository}/` : '',
  images: { unoptimized: true },
  turbopack: { root: path.join(__dirname, '..') },
  ...localOnly,
}

module.exports = nextConfig
