// app/portfolio/page.tsx
import Header               from '@/components/common/Header'
import Footer               from '@/components/common/Footer'
import PageHero             from '@/components/common/PageHero'
import PortfolioFilterClient from '@/components/portfolio/PortfolioFilterClient'
import LiveEditWrapper      from '@/components/live-edit/LiveEditWrapper'
import { getSiteConfig }    from '@/lib/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const config = await getSiteConfig()
  return { title: `Portfolio — ${config.hero_name}` }
}

export default async function PortfolioPage() {
  const config = await getSiteConfig()
  return (
    <>
      <LiveEditWrapper initialConfig={config} />
      <Header name={config.hero_name} />
      <PageHero
        label="Works"
        title={config.portfolio_hero_title || 'Portfolio'}
        desc={config.portfolio_hero_desc || 'All projects, sorted by latest.'}
        configKey="portfolio_hero_image_url"
        initialImageUrl={config.portfolio_hero_image_url ?? ''}
        titleKey="portfolio_hero_title"
        descKey="portfolio_hero_desc"
      />
      <PortfolioFilterClient />
      <Footer config={config} />
    </>
  )
}
