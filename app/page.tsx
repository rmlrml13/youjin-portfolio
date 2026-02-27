// app/page.tsx
import Cursor          from '@/components/Cursor'
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
      <Cursor />
      <Header name={config.hero_name} />
      <Hero config={config} />
      <WorksGridController />
      <About config={config} />
      <Contact config={config} />
      <footer className="site-footer">
        <span
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
