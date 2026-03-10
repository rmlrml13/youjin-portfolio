// app/contact/page.tsx
import Header         from '@/components/common/Header'
import Footer         from '@/components/common/Footer'
import ContactForm    from '@/components/contact/ContactForm'
import PageHero       from '@/components/common/PageHero'
import LiveEditWrapper from '@/components/live-edit/LiveEditWrapper'
import { getSiteConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const config = await getSiteConfig()
  return { title: `Contact — ${config.hero_name}` }
}

export default async function ContactPage() {
  const config = await getSiteConfig()
  return (
    <>
      <LiveEditWrapper initialConfig={config} />
      <Header name={config.hero_name} />
      <main className="contact-page">

        <PageHero
          label="Contact"
          title={config.contact_hero_title || "Let's Work Together"}
          desc={config.contact_hero_desc || '프로젝트 의뢰, 협업 제안, 또는 간단한 질문이 있으시면 편하게 연락주세요.'}
          configKey="contact_hero_image_url"
          initialImageUrl={config.contact_hero_image_url ?? ''}
          titleKey="contact_hero_title"
          descKey="contact_hero_desc"
        />

        {/* 본문 */}
        <div className="contact-body">
          <ContactForm />
        </div>
      </main>
      <Footer config={config} />
    </>
  )
}
