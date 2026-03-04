// components/Footer.tsx
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function Footer({ config }: Props) {
  const currentYear = new Date().getFullYear()

  const links = [
    { label: 'Instagram', href: config.contact_instagram },
    { label: 'Blog',   href: config.contact_blog   },
    { label: 'KakaoTalk',  href: config.contact_kakaotalk   },
    { label: config.contact_email, href: `mailto:${config.contact_email}` },
  ]

  return (
    <footer className="site-footer-new">
      {/* 상단: 브랜드명 + 링크들 */}
      <div className="footer-top">
        {/* 좌측: 브랜드 */}
        <div className="footer-brand">
          <span
            className="footer-brand-name editable-field"
            data-edit="footer_name"
            data-label="푸터 이름"
            data-type="text"
          >
            {config.footer_name}
          </span>
          <p className="footer-brand-desc">
            Visual Designer &amp; Art Director
          </p>
        </div>

        {/* 중앙: 빈 공간 */}
        <div className="footer-spacer" />

        {/* 우측: 링크 목록 */}
        <nav className="footer-links">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="footer-link"
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel={href.startsWith('mailto') ? undefined : 'noreferrer'}
            >
              {label}
              <span className="footer-link-arrow">↗</span>
            </a>
          ))}
        </nav>
      </div>

      {/* 구분선 */}
      <div className="footer-divider" />

      {/* 하단: 카피라이트 + 지역 */}
      <div className="footer-bottom">
        <span suppressHydrationWarning className="footer-copy">
          © {currentYear} {config.footer_name}. All rights reserved.
        </span>
        <span
          className="footer-region editable-field"
          data-edit="footer_region"
          data-label="지역"
          data-type="text"
        >
          {config.footer_region}
        </span>
      </div>
    </footer>
  )
}
