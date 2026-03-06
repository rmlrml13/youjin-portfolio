// components/home/Hero.tsx
import type { SiteConfig } from '@/lib/types'
import HeroImageEdit from '@/components/live-edit/HeroImageEdit'

interface Props { config: SiteConfig }

export default function Hero({ config }: Props) {
  const subtitleLines = config.hero_subtitle.split('|').map(s => s.trim())

  return (
    <section className="hero-section" style={{ position: 'relative' }}>
      <HeroImageEdit configKey="hero_image_url" initialUrl={config.hero_image_url ?? ''}>
        <div className="hero-text-row">
          <div className="hero-left">
            <p className="hero-index" suppressHydrationWarning>— Portfolio {new Date().getFullYear()}</p>
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
        </div>
      </HeroImageEdit>
    </section>
  )
}
