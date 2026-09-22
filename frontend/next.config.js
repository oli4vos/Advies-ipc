const isGithubPages = process.env.GITHUB_ACTIONS === 'true'
const repository = 'Advies-ipc'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGithubPages ? `/${repository}` : '',
  assetPrefix: isGithubPages ? `/${repository}/` : '',
  images: { unoptimized: true },
}

module.exports = nextConfig
