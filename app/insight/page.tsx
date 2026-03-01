// app/insight/page.tsx
import Header      from '@/components/common/Header'
import Footer      from '@/components/common/Footer'
import InsightGrid from '@/components/insight/InsightGrid'
import { getSiteConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const config = await getSiteConfig()
  return { title: `Insight — ${config.hero_name}` }
}

export default async function InsightPage() {
  const config = await getSiteConfig()
  return (
    <>
      <Header name={config.hero_name} />
      <div className="page-hero">
        <div className="page-hero-inner">
          <p className="page-hero-label">Writing</p>
          <h1 className="page-hero-title">Insight</h1>
          <p className="page-hero-desc">디자인, 프로세스, 그리고 생각들을 기록합니다.</p>
        </div>
      </div>
      <section className="ins-page-section">
        <InsightGrid />
      </section>
      <Footer config={config} />
    </>
  )
}
