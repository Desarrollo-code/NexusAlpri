/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
   webpack: (config, { isServer }) => {
    // This is to make pdf.js work with Next.js
    if (!isServer) {
      config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/build/pdf';
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/course_images/**',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/settings_images/**',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/lesson_files/**',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/resource_library/**',
      },
      {
        protocol: 'https',
        hostname: 'izefimwyuayfvektsstg.supabase.co',
        pathname: '/storage/v1/object/public/announcement_attachments/**',
      },
    ],
  },
};

module.exports = nextConfig;
