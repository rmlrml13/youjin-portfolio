// app/insight/page.tsx
import Header         from '@/components/common/Header'
import Footer         from '@/components/common/Footer'
import PageHero       from '@/components/common/PageHero'
import InsightGrid    from '@/components/insight/InsightGrid'
import LiveEditWrapper from '@/components/live-edit/LiveEditWrapper'
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
      <LiveEditWrapper initialConfig={config} />
      <Header name={config.hero_name} />
      <PageHero
        label="Writing"
        title={config.insight_hero_title || 'Insight'}
        desc={config.insight_hero_desc || '디자인, 프로세스, 그리고 생각들을 기록합니다.'}
        configKey="insight_hero_image_url"
        initialImageUrl={config.insight_hero_image_url ?? ''}
        titleKey="insight_hero_title"
        descKey="insight_hero_desc"
      />
      <section className="ins-page-section">
        <InsightGrid />
      </section>
      <Footer config={config} />
    </>
  )
}
