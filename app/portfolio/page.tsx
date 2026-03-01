// app/portfolio/page.tsx
import Header from '@/components/Header'
import PortfolioClient from '@/components/PortfolioClient'
import { getSiteConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const config = await getSiteConfig()
  return { title: `Portfolio — ${config.hero_name}` }
}

export default async function PortfolioPage() {
  const config = await getSiteConfig()

  return (
    <>
      <Header name={config.hero_name} />

      {/* 페이지 히어로 */}
      <div className="page-hero">
        <p className="page-hero-label">Works</p>
        <h1 className="page-hero-title">Portfolio</h1>
        <p className="page-hero-desc">All projects, sorted by latest.</p>
      </div>

      {/* 필터 + 전체 그리드 (클라이언트 컴포넌트) */}
      <PortfolioClient />

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {config.footer_name}. All rights reserved.</span>
        <span>{config.footer_region}</span>
      </footer>
    </>
  )
}
