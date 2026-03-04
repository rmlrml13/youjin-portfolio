'use client'
// components/InsightPreview.tsx
import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { Insight } from '@/lib/types'

const HOME_LIMIT = 3

export default function InsightPreview() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading]   = useState(true)
  const [active, setActive]     = useState('All')

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.json())
      .then(data => { setInsights(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = ['All', ...Array.from(new Set(insights.map(p => p.category))).filter(Boolean)]
  const filtered   = (active === 'All' ? insights : insights.filter(p => p.category === active)).slice(0, HOME_LIMIT)

  if (!loading && insights.length === 0) return null

  return (
    <section className="ins-prev-section">
      <div className="ins-prev-top">
        <div>
          <h2 className="ins-prev-heading">Insight</h2>
        </div>
        <Link href="/insight" className="ins-prev-viewall">
          View All <span className="ins-prev-arr">→</span>
        </Link>
      </div>

      {/* 탭 필터 */}
      <div className="ins-prev-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`ins-tab ${active === cat ? 'ins-tab--active' : ''}`}
            onClick={() => setActive(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {loading ? (
        <div style={{ padding:'3rem', textAlign:'center', color:'var(--muted)', fontSize:'12px', letterSpacing:'0.1em' }}>
          Loading...
        </div>
      ) : (
        <div className="ins-prev-grid">
          {filtered.map(post => (
            <Link key={post.id} href={`/insight/${post.id}`} className="ins-card">
              <div className="ins-card-thumb" style={{ background: post.thumbnail_url ? 'transparent' : '#ECEAE4', overflow: 'hidden', position: 'relative' }}>
                {post.thumbnail_url
                  ? <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  : null
                }
                <span className="ins-card-cat" style={{ position: 'relative', zIndex: 1 }}>{post.category}</span>
              </div>
              <div className="ins-card-body">
                <h3 className="ins-card-title">{post.title}</h3>
              </div>
              <div className="ins-card-foot">
                <span className="ins-card-date">{post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }).replace(/\. /g,'.').replace(/\.$/,'') : '—'}</span>
                <span className="ins-card-read">{(post.view_count ?? 0).toLocaleString()} views</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
