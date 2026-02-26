// app/page.tsx
import Cursor    from '@/components/Cursor'
import Header    from '@/components/Header'
import Hero      from '@/components/Hero'
import WorksGrid from '@/components/WorksGrid'
import About     from '@/components/About'
import Contact   from '@/components/Contact'
import { getSiteConfig } from '@/lib/config'

// Vercel에서 매 요청마다 최신 DB 데이터를 가져옴 (캐시 완전 비활성화)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const config = await getSiteConfig()

  return (
    <>
      <Cursor />
      <Header name={config.hero_name} />
      <Hero config={config} />
      <WorksGrid />
      <About config={config} />
      <Contact config={config} />
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {config.footer_name}. All rights reserved.</span>
        <span>{config.footer_region}</span>
      </footer>
    </>
  )
}
