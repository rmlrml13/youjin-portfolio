'use client'
// components/home/ContactBanner.tsx
import Link from 'next/link'

const CARDS = [
  {
    title: '프로젝트 상담',
    desc: '브랜딩, UI/UX, 영상 등\n다양한 프로젝트 문의',
    cta: '상담 신청하기',
    href: '/contact',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: '인스타그램',
    desc: '작업 과정과 일상을\n기록하는 공간',
    cta: '팔로우하기',
    href: 'https://instagram.com',
    external: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    title: '이메일 문의',
    desc: '간단한 질문이나\n협업 제안은 메일로',
    cta: '메일 보내기',
    href: 'mailto:hello@youjin.com',
    external: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
]

export default function ContactBanner() {
  return (
    <section className="cb-section">
      <div className="cb-inner">
        {/* 헤더 */}
        <div className="cb-header">
          <h2 className="cb-heading">
            Contact us
          </h2>
        </div>

        {/* 카드 그리드 */}
        <div className="cb-grid">
          {CARDS.map((card) => {
            const Tag = card.external ? 'a' : Link
            const extraProps = card.external
              ? { href: card.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: card.href }

            return (
              // @ts-ignore
              <Tag key={card.title} {...extraProps} className="cb-card">
                <div className="cb-card-top">
                  <div className="cb-card-icon">{card.icon}</div>
                  <span className="cb-card-arrow">↗</span>
                </div>
                <h3 className="cb-card-title">{card.title}</h3>
                <p className="cb-card-desc">{card.desc}</p>
                <span className="cb-card-cta">{card.cta}</span>
              </Tag>
            )
          })}
        </div>
      </div>

      <style>{`
        .cb-section {
          background: #fff;
          border-top: 1px solid var(--border);
          padding: 6rem var(--gap) 7rem;
        }
        .cb-inner {
          max-width: 1280px;
          margin: 0 auto;
        }
        .cb-header {
          margin-bottom: 3rem;
        }
        .cb-eyebrow {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.6rem;
          font-family: 'DM Mono', monospace;
        }
        .cb-heading {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--fg);
          line-height: 1.1;
        }
        .cb-dot {
          color: var(--accent);
        }
        .cb-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }
        .cb-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 2rem 2rem 2rem;
          background: #fff;
          text-decoration: none;
          transition: background 0.22s;
          cursor: pointer;
        }
        .cb-card:hover {
          background: #F9F8F6;
        }
        .cb-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .cb-card-icon {
          color: var(--muted);
          transition: color 0.22s;
        }
        .cb-card:hover .cb-card-icon {
          color: var(--fg);
        }
        .cb-card-arrow {
          font-size: 1.1rem;
          color: var(--border);
          transition: color 0.22s, transform 0.22s;
          display: inline-block;
        }
        .cb-card:hover .cb-card-arrow {
          color: var(--muted);
          transform: translate(2px, -2px);
        }
        .cb-card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--fg);
          line-height: 1.2;
        }
        .cb-card-desc {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.8;
          white-space: pre-line;
          font-family: 'DM Mono', monospace;
          flex: 1;
        }
        .cb-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
          margin-top: 0.5rem;
          transition: color 0.22s;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.2rem;
          width: fit-content;
        }
        .cb-card:hover .cb-card-cta {
          color: var(--fg);
          border-bottom-color: var(--fg);
        }

        @media (max-width: 875px) {
          .cb-section { padding: 4rem var(--gap) 5rem; }
          .cb-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
