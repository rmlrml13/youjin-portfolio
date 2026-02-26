// components/About.tsx
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function About({ config }: Props) {
  const skills = config.about_skills.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <section id="about" className="about-section">
      <div className="about-label">About</div>
      <div className="about-content">
        <h2>Designing with<br /><em>intention &amp; care</em></h2>
        {config.about_text1 && <p>{config.about_text1}</p>}
        {config.about_text2 && <p>{config.about_text2}</p>}
        <div className="skills-row">
          {skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      </div>
    </section>
  )
}
