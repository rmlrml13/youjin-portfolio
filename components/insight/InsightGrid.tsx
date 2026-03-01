'use client'
// components/InsightGrid.tsx
import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { Insight } from '@/lib/types'

export default function InsightGrid() {
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
  const filtered   = active === 'All' ? insights : insights.filter(p => p.category === active)

  return (
    <>
      {/* 탭 필터 */}
      <div className="ins-page-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`ins-tab ${active === cat ? 'ins-tab--active' : ''}`}
            onClick={() => setActive(cat)}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ins-tab-count">
                {insights.filter(p => p.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className="ins-page-grid">
        {loading && (
          <div style={{ gridColumn:'1/-1', padding:'6rem', textAlign:'center', color:'var(--muted)', fontSize:'12px', letterSpacing:'0.1em' }}>
            Loading...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', padding:'6rem', textAlign:'center', color:'var(--muted)', fontSize:'12px' }}>
            등록된 글이 없습니다.
          </div>
        )}
        {filtered.map(post => (
          <div key={post.id} className="ins-card ins-card--page">
            <div className="ins-card-thumb">
              <span className="ins-card-cat">{post.category}</span>
            </div>
            <div className="ins-card-body">
              <h3 className="ins-card-title">{post.title}</h3>
              <p className="ins-card-desc">{post.description}</p>
            </div>
            <div className="ins-card-foot">
              <span className="ins-card-date">{post.date}</span>
              <span className="ins-card-read">{post.read_time}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
