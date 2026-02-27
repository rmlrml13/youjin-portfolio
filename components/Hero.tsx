// components/Hero.tsx
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function Hero({ config }: Props) {
  const subtitleLines = config.hero_subtitle.split('|').map(s => s.trim())

  return (
    <>
      <section className="hero-section">
        <div className="hero-text-row site-wrapper">
          <div className="hero-left">
            <p className="hero-index">— Portfolio {new Date().getFullYear()}</p>
            <h1
              className="hero-title editable-field"
              data-edit="hero_subtitle"
              data-label="Hero 부제목"
              data-type="text"
              title="클릭하여 수정"
            >
              {subtitleLines.map((line, i) => (
                <span key={i}>
                  {i === 1 ? <em>{line}</em> : line}
                  {i < subtitleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          </div>
          <div className="hero-right">
            <p
              className="hero-desc editable-field"
              data-edit="hero_desc"
              data-label="Hero 소개 문구"
              data-type="textarea"
              title="클릭하여 수정"
            >
              {config.hero_desc}
            </p>
            <a href="#works" className="hero-cta">View selected works</a>
          </div>
        </div>
      </section>

      <div className="info-strip">
        <span
          className="editable-field"
          data-edit="footer_region"
          data-label="지역"
          data-type="text"
          title="클릭하여 수정"
        >
          {config.footer_region} — Available for projects
        </span>
        <span className="scroll-label">Scroll to explore</span>
      </div>
    </>
  )
}
