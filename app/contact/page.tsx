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

          {/* 왼쪽 — 연락처 정보 */}
          <div className="contact-info">
            <div className="contact-info-block">
              <p className="contact-info-label">Email</p>
              <a href={`mailto:${config.contact_email}`} className="contact-info-value">
                {config.contact_email}
              </a>
            </div>
            {config.contact_instagram && config.contact_instagram !== '#' && (
              <div className="contact-info-block">
                <p className="contact-info-label">Instagram</p>
                <a href={config.contact_instagram} target="_blank" rel="noreferrer" className="contact-info-value">
                  @instagram ↗
                </a>
              </div>
            )}
            {config.contact_kakaotalk && config.contact_kakaotalk !== '#' && (
              <div className="contact-info-block">
                <p className="contact-info-label">KakaoTalk</p>
                <a href={config.contact_kakaotalk} target="_blank" rel="noreferrer" className="contact-info-value">
                  오픈채팅 ↗
                </a>
              </div>
            )}
            <div className="contact-info-block">
              <p className="contact-info-label">Response Time</p>
              <p className="contact-info-value" style={{ color: '#888880' }}>
                영업일 기준 1–2일 내 회신
              </p>
            </div>
          </div>

          {/* 오른쪽 — 폼 */}
          <ContactForm />

        </div>
      </main>
      <Footer config={config} />
    </>
  )
}
