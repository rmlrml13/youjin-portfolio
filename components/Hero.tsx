// components/Hero.tsx
import Image from 'next/image'
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function Hero({ config }: Props) {
  const subtitleLines = config.hero_subtitle.split('|').map(s => s.trim())
  const hasImage      = !!config.hero_image_url
  const heroHeight    = config.hero_height?.trim() || '300px'

  return (
    <>
      <section
        className={`hero-section${hasImage ? ' has-image' : ''}`}
        style={hasImage ? { minHeight: heroHeight } : undefined}
      >
        {/* 이미지가 있을 때만 이미지 영역 렌더링 */}
        {hasImage && (
          <div className="hero-image-area">
            <Image
              src={config.hero_image_url}
              alt="Hero"
              fill
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        {/* 텍스트 영역 */}
        <div className="hero-text-row site-wrapper">
          <div className="hero-left">
            <p className="hero-index">— Portfolio {new Date().getFullYear()}</p>
            <h1 className="hero-title">
              {subtitleLines.map((line, i) => (
                <span key={i}>
                  {i === 1 ? <em>{line}</em> : line}
                  {i < subtitleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-desc">{config.hero_desc}</p>
            <a href="#works" className="hero-cta">View selected works</a>
          </div>
        </div>
      </section>

      <div className="info-strip">
        <span>{config.footer_region} — Available for projects</span>
        <span className="scroll-label">Scroll to explore</span>
      </div>
    </>
  )
}
