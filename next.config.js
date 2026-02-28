/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',   // Supabase Storage 이미지 허용
      },
    ],
    // 이미지 캐시 최소화 — 업로드 후 바로 반영되도록
    minimumCacheTTL: 0,
  },
}

module.exports = nextConfig
