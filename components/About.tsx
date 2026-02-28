// components/About.tsx
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function About({ config }: Props) {
  const skills   = config.about_skills.split(',').map(s => s.trim()).filter(Boolean)
  const hasImage = !!config.about_image_url

  return (
    <section id="about" className={`about-section ${hasImage ? 'has-image' : ''}`}>

      <div className="about-left">
        <div className="about-label">About</div>
        
      </div>

      <div className="about-content">
        <h2>Designing with<br /><em>intention &amp; care</em></h2>
        <p
          className="editable-field"
          data-edit="about_text1"
          data-label="About 소개 문단 1"
          data-type="textarea"
          title="클릭하여 수정"
        >
          {config.about_text1}
        </p>
        <p
          className="editable-field"
          data-edit="about_text2"
          data-label="About 소개 문단 2"
          data-type="textarea"
          title="클릭하여 수정"
        >
          {config.about_text2}
        </p>
        <div
          className="skills-row editable-field"
          data-edit="about_skills"
          data-label="스킬 태그"
          data-type="skills"
          title="클릭하여 수정"
        >
          {skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      </div>

    </section>
  )
}
