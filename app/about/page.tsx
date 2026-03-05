// app/about/page.tsx
import Header   from '@/components/common/Header'
import Footer   from '@/components/common/Footer'
import PageHero from '@/components/common/PageHero'
import { getSiteConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const config = await getSiteConfig()
  return { title: `About — ${config.hero_name}` }
}

export default async function AboutPage() {
  const config = await getSiteConfig()
  const skills  = config.about_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
  const hasImage = !!config.about_image_url

  return (
    <>
      <Header name={config.hero_name} />
      <PageHero
        label="About" title="About" desc="what i think, what i pursue"
        configKey="about_hero_image_url"
        initialImageUrl={config.about_hero_image_url ?? ''}
        posKey="about_hero_text_pos"
        initialPos={config.about_hero_text_pos ?? ''}
      />

      <section className="about-simple-section">
        <div className="about-simple-inner">
          <div className="about-simple-img-wrap editable-field" data-edit="about_image_url" data-label="About 이미지" data-type="image">
            {hasImage
              ? <img src={config.about_image_url} alt={config.hero_name} className="about-simple-img" />
              : <div className="about-simple-img-placeholder">+ 이미지 추가</div>
            }
          </div>
          <div className="about-simple-content">
            <h2 className="about-simple-name editable-field" data-edit="footer_name" data-label="이름" data-type="text">
              {config.footer_name}
            </h2>
            <p className="about-simple-role">Visual Designer &amp; Art Director</p>
            <p className="about-simple-para editable-field" data-edit="about_text1" data-label="소개 문단 1" data-type="textarea">
              {config.about_text1}
            </p>
            <p className="about-simple-para editable-field" data-edit="about_text2" data-label="소개 문단 2" data-type="textarea">
              {config.about_text2}
            </p>
            <div className="about-simple-badges editable-field" data-edit="about_skills" data-label="스킬 태그" data-type="skills">
              {skills.map((s: string) => (
                <span key={s} className="about-badge">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer config={config} />
    </>
  )
}
