'use client'
// components/portfolio/PortfolioFilterClient.tsx
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'
import QuickEditPanel, { type QuickEditTarget } from '@/components/live-edit/QuickEditPanel'

const ROMAN    = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']
const PER_PAGE = 6

export default function PortfolioFilterClient() {
  const [projects,   setProjects]   = useState<Project[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeTag,  setActiveTag]  = useState('All')
  const [page,       setPage]       = useState(1)
  const [editMode,   setEditMode]   = useState(false)
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<QuickEditTarget | null>(null)
  const [token,      setToken]      = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  function load() {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    setToken(localStorage.getItem('youjin_token') ?? '')
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setEditMode(document.body.classList.contains('live-edit-mode'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    setEditMode(document.body.classList.contains('live-edit-mode'))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!gridRef.current || loading || editMode) return
    gridRef.current.querySelectorAll('.work-item').forEach(el => el.classList.remove('visible'))
    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting)
          setTimeout(() => entry.target.classList.add('visible'), i * 60)
      })
    }, { threshold: 0.04 })
    gridRef.current.querySelectorAll('.work-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [projects, loading, activeTag, page, editMode])

  function handleTagChange(tag: string) {
    setActiveTag(tag)
    setPage(1)
  }

  function openEdit(p: Project) {
    setEditTarget({
      type:      'project',
      id:        p.id,
      title:     p.title,
      tag:       p.tag,
      thumbnail: p.image_url,
    })
    setPanelOpen(true)
  }

  const tags       = ['All', ...Array.from(new Set(projects.map(p => p.tag))).filter(Boolean)]
  const filtered   = activeTag === 'All' ? projects : projects.filter(p => p.tag === activeTag)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <>
      <section className="portfolio-page-section">
        {/* 태그 필터 바 */}
        <div className="portfolio-filter-bar">
          {tags.map(tag => (
            <button
              key={tag}
              className={`portfolio-filter-btn ${activeTag === tag ? 'active' : ''}`}
              onClick={() => handleTagChange(tag)}
            >
              {tag}
              {tag !== 'All' && (
                <span className="portfolio-filter-count">{projects.filter(p => p.tag === tag).length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="portfolio-grid-meta">
          <span>{filtered.length} projects</span>
          {totalPages > 1 && (
            <span style={{ color:'var(--muted)', fontSize:'11px' }}>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}
            </span>
          )}
        </div>

        <div className="works-grid" ref={gridRef}>
          {loading && (
            <div style={{ gridColumn:'1/-1', color:'var(--muted)', padding:'6rem', textAlign:'center', fontSize:'12px', letterSpacing:'0.1em' }}>Loading...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', color:'var(--muted)', padding:'6rem', textAlign:'center', fontSize:'12px' }}>해당 태그의 프로젝트가 없습니다.</div>
          )}

          {paginated.map((p, i) => (
            editMode ? (
              <div
                key={p.id}
                className="work-item visible"
                style={{ cursor: 'pointer' }}
                onClick={() => openEdit(p)}
              >
                <div className="work-thumb" style={{ position:'relative' }}>
                  {p.image_url
                    ? <Image src={p.image_url} alt={p.title} fill style={{ objectFit:'cover' }} />
                    : <div className="work-thumb-placeholder">{ROMAN[i] || i + 1}</div>
                  }
                  <div className="work-edit-overlay"><span>✏ 수정</span></div>
                </div>
                <div className="work-info">
                  <p className="work-tag">{p.tag}</p>
                  <h3 className="work-title">{p.title}</h3>
                </div>
              </div>
            ) : (
              <Link key={p.id} href={`/portfolio/${p.id}`} className="work-item" style={{ textDecoration:'none' }}>
                <div className="work-thumb" style={{ position:'relative' }}>
                  {p.image_url
                    ? <Image src={p.image_url} alt={p.title} fill style={{ objectFit:'cover' }} />
                    : <div className="work-thumb-placeholder">{ROMAN[i] || i + 1}</div>
                  }
                  <div className="work-hover-overlay"><span>View Project →</span></div>
                </div>
                <div className="work-info">
                  <p className="work-tag">{p.tag}</p>
                  <h3 className="work-title">{p.title}</h3>
                </div>
              </Link>
            )
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} className={`pagination-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        )}
      </section>

      {panelOpen && editTarget && (
        <QuickEditPanel
          target={editTarget}
          token={token}
          onSaved={() => { setPanelOpen(false); load() }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}
