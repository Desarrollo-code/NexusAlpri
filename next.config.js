/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
       // Añadimos el dominio de la aplicación para permitir imágenes locales
      {
        protocol: 'https',
        hostname: process.env.RENDER_EXTERNAL_HOSTNAME,
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
};

module.exports = nextConfig;
