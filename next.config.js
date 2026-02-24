/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',   // Supabase Storage 이미지 허용
      },
    ],
  },
}

module.exports = nextConfig
