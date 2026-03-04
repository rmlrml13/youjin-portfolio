'use client'
// components/InsightPreview.tsx
import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { Insight } from '@/lib/types'
import QuickEditPanel, { type QuickEditTarget } from '@/components/live-edit/QuickEditPanel'

const HOME_LIMIT = 3

export default function InsightPreview() {
  const [insights,   setInsights]   = useState<Insight[]>([])
  const [loading,    setLoading]    = useState(true)
  const [active,     setActive]     = useState('All')
  const [editMode,   setEditMode]   = useState(false)
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<QuickEditTarget | null>(null)
  const [token,      setToken]      = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('youjin_token') ?? '')
    const observer = new MutationObserver(() => {
      setEditMode(document.body.classList.contains('live-edit-mode'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    setEditMode(document.body.classList.contains('live-edit-mode'))
    return () => observer.disconnect()
  }, [])

  function load() {
    fetch('/api/insights')
      .then(r => r.json())
      .then(data => { setInsights(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openEdit(ins: Insight) {
    setEditTarget({
      type:      'insight',
      id:        ins.id,
      title:     ins.title,
      tag:       ins.category,
      thumbnail: ins.thumbnail_url ?? '',
    })
    setPanelOpen(true)
  }

  const categories = ['All', ...Array.from(new Set(insights.map(p => p.category))).filter(Boolean)]
  const filtered   = (active === 'All' ? insights : insights.filter(p => p.category === active)).slice(0, HOME_LIMIT)

  if (!loading && insights.length === 0) return null

  return (
    <section className="ins-prev-section">
      <div className="ins-prev-top">
        <h2 className="ins-prev-heading">Insight</h2>
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
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', fontSize: '12px', letterSpacing: '0.1em' }}>
          Loading...
        </div>
      ) : (
        <div className="ins-prev-grid">
          {filtered.map(post => (
            editMode ? (
              <div
                key={post.id}
                className="ins-card"
                onClick={() => openEdit(post)}
                style={{ cursor: 'pointer' }}
              >
                <div className="ins-card-thumb" style={{ background: post.thumbnail_url ? 'transparent' : '#ECEAE4', overflow: 'hidden', position: 'relative' }}>
                  {post.thumbnail_url
                    ? <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    : null
                  }
                  <span className="ins-card-cat" style={{ position: 'relative', zIndex: 1 }}>{post.category}</span>
                  <div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0')}
                  >
                    <span style={{ color: '#fff', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>✏ 수정</span>
                  </div>
                </div>
                <div className="ins-card-body">
                  <h3 className="ins-card-title">{post.title}</h3>
                </div>
                <div className="ins-card-foot">
                  <span className="ins-card-date">{post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : '—'}</span>
                  <span className="ins-card-read">{(post.view_count ?? 0).toLocaleString()} views</span>
                </div>
              </div>
            ) : (
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
                  <span className="ins-card-date">{post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : '—'}</span>
                  <span className="ins-card-read">{(post.view_count ?? 0).toLocaleString()} views</span>
                </div>
              </Link>
            )
          ))}
        </div>
      )}

      {/* QuickEditPanel */}
      {panelOpen && editTarget && (
        <QuickEditPanel
          target={editTarget}
          token={token}
          onSaved={() => { setPanelOpen(false); load() }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </section>
  )
}
