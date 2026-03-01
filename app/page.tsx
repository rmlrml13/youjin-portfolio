// app/page.tsx
import Header                  from '@/components/common/Header'
import Hero                    from '@/components/home/Hero'
import Footer                  from '@/components/common/Footer'
import LiveEditWrapper         from '@/components/live-edit/LiveEditWrapper'
import PortfolioGridController from '@/components/portfolio/PortfolioGridController'
import InsightPreview          from '@/components/home/InsightPreview'
import { getSiteConfig }       from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const config = await getSiteConfig()

  return (
    <>
      <Header name={config.hero_name} />
      <Hero config={config} />

      {/* Tagline */}
      <div className="tagline-section">
        <h2>Design for Impact!</h2>
        <p className="editable-field" data-edit="hero_desc" data-label="tagline 문구" data-type="textarea">
          {config.hero_desc}
        </p>
      </div>

      {/* Portfolio 그리드 (6개 + More 버튼) */}
      <PortfolioGridController />

      {/* Insight 프리뷰 */}
      <InsightPreview />

      <Footer config={config} />
      <LiveEditWrapper initialConfig={config} />
    </>
  )
}
