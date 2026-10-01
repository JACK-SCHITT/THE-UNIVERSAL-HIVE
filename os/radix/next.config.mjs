const agentHost = process.env.AGENT_WEB_HOST

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: agentHost ? [agentHost] : [],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://superconductor.com https://*.superconductor.com;",
          },
        ],
      },
    ]
  },
}

export default nextConfig
