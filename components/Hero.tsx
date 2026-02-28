// components/Hero.tsx
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function Hero({ config }: Props) {
  const subtitleLines = config.hero_subtitle.split('|').map(s => s.trim())

  return (
    <section className="hero-section">
      <div className="hero-text-row">

        {/* 왼쪽 — 타이틀 + CTA */}
        <div className="hero-left">
          <p className="hero-index" suppressHydrationWarning>
            — Portfolio {new Date().getFullYear()}
          </p>
          <h1
            className="hero-title editable-field"
            data-edit="hero_subtitle"
            data-label="Hero 타이틀"
            data-type="text"
          >
            {subtitleLines.map((line, i) => (
              <span key={i}>
                {i === 1 ? <em>{line}</em> : line}
                {i < subtitleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p
            className="hero-desc editable-field"
            data-edit="hero_desc"
            data-label="Hero 소개 문구"
            data-type="textarea"
          >
            {config.hero_desc}
          </p>
          <a href="#works" className="hero-cta">View Works</a>
        </div>

        {/* 오른쪽 — 장식 카드들 */}
        <div className="hero-right">
          <div className="hero-cards">
            <div className="hero-card hero-card--light" style={{ top: '0', right: '120px' }}>
              <span className="hero-card-label">Strategy</span>
              <div className="hero-card-icon">◈</div>
            </div>
            <div className="hero-card hero-card--red" style={{ top: '60px', right: '-10px' }}>
              <span className="hero-card-label" style={{ color: '#fff' }}>Design</span>
              <div className="hero-card-icon" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '3rem' }}>◉</div>
            </div>
            <div className="hero-card hero-card--light" style={{ top: '240px', right: '80px' }}>
              <span className="hero-card-label">Creative</span>
              <div className="hero-card-icon">▲</div>
            </div>
            <div className="hero-card hero-card--dark" style={{ top: '300px', right: '-10px' }}>
              <span className="hero-card-label" style={{ color: 'var(--accent)' }}>Portfolio</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
