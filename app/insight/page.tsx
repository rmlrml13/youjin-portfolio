// app/insight/page.tsx
import Header from '@/components/Header'
import { getSiteConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const config = await getSiteConfig()
  return { title: `Insight — ${config.hero_name}` }
}

// 임시 인사이트 데이터 (추후 DB 연동 가능)
const INSIGHTS = [
  {
    id: 1,
    category: 'Design Thinking',
    title: '좋은 브랜드 아이덴티티를 만드는 5가지 원칙',
    desc: '브랜드는 단순한 로고가 아닙니다. 고객이 경험하는 모든 접점에서 일관된 감정을 전달하는 시스템이어야 합니다.',
    date: '2025.01',
    readTime: '5 min read',
  },
  {
    id: 2,
    category: 'Typography',
    title: '타이포그래피로 감정을 설계하는 법',
    desc: '폰트 선택은 단순한 미학적 결정이 아닙니다. 폰트는 목소리의 톤이고, 독자가 콘텐츠를 받아들이는 방식 자체를 바꿉니다.',
    date: '2024.12',
    readTime: '4 min read',
  },
  {
    id: 3,
    category: 'Process',
    title: '클라이언트와의 첫 미팅에서 물어야 할 질문들',
    desc: '프로젝트의 성패는 종종 첫 미팅에서 결정됩니다. 제대로 된 질문으로 클라이언트의 진짜 니즈를 파악하는 방법을 공유합니다.',
    date: '2024.11',
    readTime: '6 min read',
  },
  {
    id: 4,
    category: 'Color',
    title: '색상 심리학: 팔레트가 메시지를 바꾸는 방식',
    desc: '같은 디자인이라도 색상 하나로 브랜드의 신뢰도, 에너지, 감성이 달라집니다. 색상 심리학의 실전 적용 사례를 살펴봅니다.',
    date: '2024.10',
    readTime: '7 min read',
  },
  {
    id: 5,
    category: 'Trend',
    title: '2025 그래픽 디자인 트렌드 미리보기',
    desc: '미니멀리즘의 진화, 브루탈리즘의 귀환, AI와 협업하는 디자이너의 역할 변화까지. 올해 주목해야 할 디자인 방향을 정리했습니다.',
    date: '2025.01',
    readTime: '8 min read',
  },
  {
    id: 6,
    category: 'Tool',
    title: 'Figma에서 디자인 시스템 구축하기 — 실전 가이드',
    desc: '컴포넌트, 토큰, 문서화까지. 팀과 함께 일관된 디자인을 유지하는 Figma 기반 시스템 설계의 모든 것을 담았습니다.',
    date: '2024.09',
    readTime: '10 min read',
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(INSIGHTS.map(p => p.category)))]

export default async function InsightPage() {
  const config = await getSiteConfig()

  return (
    <>
      <Header name={config.hero_name} />

      {/* 페이지 히어로 */}
      <div className="page-hero">
        <p className="page-hero-label">Writing</p>
        <h1 className="page-hero-title">Insight</h1>
        <p className="page-hero-desc">디자인, 프로세스, 그리고 생각들을 기록합니다.</p>
      </div>

      {/* 인사이트 목록 */}
      <section className="insight-section">
        <div className="insight-list">
          {INSIGHTS.map((post, i) => (
            <article key={post.id} className="insight-item">
              <div className="insight-meta">
                <span className="insight-category">{post.category}</span>
                <span className="insight-date">{post.date}</span>
              </div>
              <div className="insight-body">
                <h2 className="insight-title">{post.title}</h2>
                <p className="insight-desc">{post.desc}</p>
                <span className="insight-read">{post.readTime}</span>
              </div>
              <div className="insight-num">{String(i + 1).padStart(2, '0')}</div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {config.footer_name}. All rights reserved.</span>
        <span>{config.footer_region}</span>
      </footer>
    </>
  )
}
