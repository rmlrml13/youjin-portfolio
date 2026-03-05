// components/home/Hero.tsx
import type { SiteConfig } from '@/lib/types'
import HeroImageEdit from '@/components/live-edit/HeroImageEdit'
import DraggableItem from '@/components/live-edit/DraggableItem'

interface Props { config: SiteConfig }

export default function Hero({ config }: Props) {
  const subtitleLines = config.hero_subtitle.split('|').map(s => s.trim())

  return (
    <section className="hero-section" style={{ position: 'relative' }} data-hero-container>
      <HeroImageEdit configKey="hero_image_url" initialUrl={config.hero_image_url ?? ''}>

        {/* 타이틀 */}
        <DraggableItem posKey="hero_title_pos" initialPos={config.hero_title_pos ?? ''}>
          <div className="hero-left" style={{ maxWidth: '480px' }}>
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
          </div>
        </DraggableItem>

        {/* 소개 문구 */}
        <DraggableItem posKey="hero_desc_pos" initialPos={config.hero_desc_pos ?? ''}>
          <p
            className="hero-desc editable-field"
            data-edit="hero_desc"
            data-label="Hero 소개 문구"
            data-type="textarea"
            style={{ maxWidth: '360px' }}
          >
            {config.hero_desc}
          </p>
        </DraggableItem>

        {/* CTA 버튼 */}
        <DraggableItem posKey="hero_cta_pos" initialPos={config.hero_cta_pos ?? ''}>
          <a href="#works" className="hero-cta">View Works</a>
        </DraggableItem>

      </HeroImageEdit>
    </section>
  )
}
