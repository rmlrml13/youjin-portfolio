// app/page.tsx
import Header          from '@/components/Header'
import Hero            from '@/components/Hero'
import About           from '@/components/About'
import Contact         from '@/components/Contact'
import LiveEditWrapper from '@/components/LiveEditWrapper'
import WorksGridController from '@/components/WorksGridController'
import { getSiteConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const config = await getSiteConfig()

  return (
    <>
      <Header name={config.hero_name} />
      <Hero config={config} />

      {/* Tagline 섹션 — 흰 배경 + 중앙 대형 텍스트 */}
      <div className="tagline-section">
        <h2>Behind Your Victory!</h2>
        <p
          className="editable-field"
          data-edit="hero_desc"
          data-label="tagline 문구"
          data-type="textarea"
        >
          {config.hero_desc}
        </p>
      </div>

      <WorksGridController />
      <About config={config} />
      <Contact config={config} />

      <footer className="site-footer">
        <span
          suppressHydrationWarning
          className="editable-field"
          data-edit="footer_name"
          data-label="이름"
          data-type="text"
        >
          © {new Date().getFullYear()} {config.footer_name}. All rights reserved.
        </span>
        <span
          className="editable-field"
          data-edit="footer_region"
          data-label="지역"
          data-type="text"
        >
          {config.footer_region}
        </span>
      </footer>

      <LiveEditWrapper initialConfig={config} />
    </>
  )
}
