/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase Storage 이미지 허용
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // 이미지 캐시 최소화 — 업로드 후 바로 반영되도록
    minimumCacheTTL: 0,
    // 반응형 이미지 사이즈 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },
  // 빌드 시 타입 에러·ESLint 에러를 경고로만 처리 (CI 배포 유연성)
  typescript: { ignoreBuildErrors: false },
  eslint:     { ignoreDuringBuilds: false },
}

module.exports = nextConfig
