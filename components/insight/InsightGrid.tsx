'use client'
// components/insight/InsightGrid.tsx
import { useState, useEffect } from 'react'
import type { Insight } from '@/lib/types'

const PER_PAGE = 6

export default function InsightGrid() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading,  setLoading]  = useState(true)
  const [active,   setActive]   = useState('All')
  const [page,     setPage]     = useState(1)

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.json())
      .then(data => { setInsights(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // 카테고리 바뀌면 1페이지로
  function handleCatChange(cat: string) {
    setActive(cat)
    setPage(1)
  }

  const categories = ['All', ...Array.from(new Set(insights.map(p => p.category))).filter(Boolean)]
  const filtered   = active === 'All' ? insights : insights.filter(p => p.category === active)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <>
      {/* 탭 필터 */}
      <div className="ins-page-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`ins-tab ${active === cat ? 'ins-tab--active' : ''}`}
            onClick={() => handleCatChange(cat)}
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
        {paginated.map(post => (
          <a key={post.id} href={`/insight/${post.id}`} className="ins-card ins-card--page">
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
          </a>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`pagination-btn ${page === n ? 'active' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            →
          </button>
        </div>
      )}
    </>
  )
}
