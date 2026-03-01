// app/portfolio/page.tsx
import Header               from '@/components/common/Header'
import Footer               from '@/components/common/Footer'
import PortfolioFilterClient from '@/components/portfolio/PortfolioFilterClient'
import { getSiteConfig }    from '@/lib/config'

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
      <div className="page-hero">
        <div className="page-hero-inner">
          <p className="page-hero-label">Works</p>
          <h1 className="page-hero-title">Portfolio</h1>
          <p className="page-hero-desc">All projects, sorted by latest.</p>
        </div>
      </div>
      <PortfolioFilterClient />
      <Footer config={config} />
    </>
  )
}
