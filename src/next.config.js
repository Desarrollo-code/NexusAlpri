/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false, // Asegurarnos que la optimización esté activada
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
};

module.exports = nextConfig;