/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/**', // Agrega esta línea
      },
        {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      }
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Aumentar el límite a 10MB
    },
  },
};

module.exports = nextConfig;
