// app/insight/page.tsx
import Header      from '@/components/common/Header'
import Footer      from '@/components/common/Footer'
import PageHero    from '@/components/common/PageHero'
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
      <PageHero
        label="Writing" title="Insight" desc="디자인, 프로세스, 그리고 생각들을 기록합니다."
        configKey="insight_hero_image_url"
        initialImageUrl={config.insight_hero_image_url ?? ''}
        posKey="insight_hero_text_pos"
        initialPos={config.insight_hero_text_pos ?? ''}
      />
      <section className="ins-page-section">
        <InsightGrid />
      </section>
      <Footer config={config} />
    </>
  )
}
