/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization — allow external image sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "rukminim1.flixcart.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // API body size limit (for file uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/deals",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/deals",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;