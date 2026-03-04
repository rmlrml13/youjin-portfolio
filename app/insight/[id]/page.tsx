// app/insight/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { getSiteConfig } from '@/lib/config'
import { supabase } from '@/lib/supabase'
import type { Insight } from '@/lib/types'
import InsightViewTracker from '@/components/insight/InsightViewTracker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getInsight(id: string): Promise<Insight | null> {
  const { data, error } = await supabase
    .from('insights').select('*').eq('id', id).single()
  if (error || !data) return null
  return data
}

async function getAdjacentInsights(currentId: number) {
  const { data } = await supabase
    .from('insights').select('id, title, category')
    .order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (!data) return { prev: null, next: null }
  const idx = data.findIndex(p => p.id === currentId)
  return {
    prev: idx > 0               ? data[idx - 1] : null,
    next: idx < data.length - 1 ? data[idx + 1] : null,
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const insight = await getInsight(params.id)
  if (!insight) return { title: 'Not Found' }
  const config = await getSiteConfig()
  return { title: `${insight.title} — ${config.hero_name}` }
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export default async function InsightDetailPage({ params }: { params: { id: string } }) {
  const [insight, config] = await Promise.all([
    getInsight(params.id),
    getSiteConfig(),
  ])
  if (!insight) notFound()

  const { prev, next } = await getAdjacentInsights(insight.id)
  const contentHtml = (insight as any).content_html ?? ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header name={config.hero_name} />
      <InsightViewTracker insightId={insight.id} />

      {/* 히어로 */}
      <div className="ins-detail-hero">
        <div className="ins-detail-hero-inner">
          <span className="ins-detail-cat">{insight.category}</span>
          <h1 className="ins-detail-title">{insight.title}</h1>
        </div>
      </div>

      {/* 메타 바 */}
      <div className="pd-meta-bar">
        <div className="pd-meta-bar-inner">
          <span className="pd-meta-bar-item">{insight.category}</span>
          <span className="pd-meta-bar-dot">·</span>
          <span className="pd-meta-bar-item">{fmtDate(insight.created_at)}</span>
          <span className="pd-meta-bar-dot">·</span>
          <span className="pd-meta-bar-item">Views {(insight.view_count ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* 본문 — TipTap HTML 렌더링 */}
      {contentHtml && (
        <article className="pd-blocks insight-body" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      )}

      {/* 이전 / 다음 */}
      <nav className="pd-nav">
        <div className="pd-nav-inner">
          {prev
            ? <Link href={`/insight/${prev.id}`} className="pd-nav-item pd-nav-prev">
                <span className="pd-nav-label">← Previous</span>
                <span className="pd-nav-title">{prev.title}</span>
              </Link>
            : <div />
          }
          <Link href="/insight" className="pd-nav-all">Back List</Link>
          {next
            ? <Link href={`/insight/${next.id}`} className="pd-nav-item pd-nav-next">
                <span className="pd-nav-label">Next →</span>
                <span className="pd-nav-title">{next.title}</span>
              </Link>
            : <div />
          }
        </div>
      </nav>

      <div style={{ flex: 1 }} />
      <Footer config={config} />
    </div>
  )
}
