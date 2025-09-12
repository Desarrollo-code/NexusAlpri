/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/**', // This is the crucial line.
      },
        {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      }
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
