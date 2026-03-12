'use client'
// components/portfolio/PortfolioGrid.tsx
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'

const ROMAN = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']
const HOME_LIMIT = 6

export interface PortfolioGridHandle {
  reload: () => void
}

interface Props {
  showAll?: boolean
}

const PortfolioGrid = forwardRef<PortfolioGridHandle, Props>(function PortfolioGrid({ showAll = false }, ref) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [editMode, setEditMode] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    const data = await fetch('/api/projects').then(r => r.json()).catch(() => [])
    setProjects(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useImperativeHandle(ref, () => ({ reload: load }))

  useEffect(() => { load() }, [])

  useEffect(() => {
    // 커스텀 이벤트 수신
    const handler = (e: Event) => setEditMode((e as CustomEvent).detail.editMode)
    window.addEventListener('edit-mode-change', handler)

    // body class 직접 감시 (LiveEditWrapper와 타이밍 차이 보완)
    const observer = new MutationObserver(() => {
      setEditMode(document.body.classList.contains('live-edit-mode'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    // 초기값
    setEditMode(document.body.classList.contains('live-edit-mode'))

    return () => {
      window.removeEventListener('edit-mode-change', handler)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!gridRef.current || loading) return
    // editMode일 땐 observer 불필요 (visible 클래스를 직접 부여)
    if (editMode) return
    // 이미 visible인 항목 초기화 후 재관찰
    gridRef.current.querySelectorAll('.work-item').forEach(el => el.classList.remove('visible'))
    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting)
          setTimeout(() => entry.target.classList.add('visible'), i * 80)
      })
    }, { threshold: 0.05 })
    gridRef.current.querySelectorAll('.work-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [projects, loading, editMode])

  function dispatchEdit(project: Project) {
    window.dispatchEvent(new CustomEvent('project-edit', { detail: { action: 'edit', project } }))
  }

  const displayed = showAll ? projects : projects.slice(0, HOME_LIMIT)
  const hasMore   = !showAll && projects.length > HOME_LIMIT

  return (
    <section id="works" className="works-section">
      <div className="section-header">
        <h2 className="section-title">{showAll ? 'Portfolio' : 'Recent Portfolio'}</h2>
      </div>

      <div className="works-grid" ref={gridRef}>
        {loading && (
          <div style={{ gridColumn:'1/-1', color:'var(--muted)', padding:'4rem', textAlign:'center', fontSize:'12px', letterSpacing:'0.1em' }}>
            Loading...
          </div>
        )}
        {!loading && projects.length === 0 && (
          <div style={{ gridColumn:'1/-1', color:'var(--muted)', padding:'4rem', textAlign:'center', fontSize:'12px' }}>
            등록된 프로젝트가 없습니다.
          </div>
        )}

        {displayed.map((p, i) => (
          editMode ? (
            <div
              key={p.id}
              className="work-item visible"
              onClick={() => dispatchEdit(p)}
              style={{ cursor:'pointer' }}
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
            <Link
              key={p.id}
              href={`/portfolio/${p.id}`}
              className="work-item"
              style={{ textDecoration:'none' }}
            >
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

      {hasMore && !editMode && (
        <div className="works-more-wrap">
          <Link href="/portfolio" className="works-more-btn">
            View All Works <span className="works-more-arrow">→</span>
          </Link>
          <p className="works-more-count">{projects.length - HOME_LIMIT} more projects</p>
        </div>
      )}
    </section>
  )
})

export default PortfolioGrid
