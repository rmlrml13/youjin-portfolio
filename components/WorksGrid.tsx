'use client'
// components/WorksGrid.tsx
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import type { Project } from '@/lib/types'

const ROMAN = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']

export interface WorksGridHandle {
  reload: () => void
}

const WorksGrid = forwardRef<WorksGridHandle, {}>(function WorksGrid(_, ref) {
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

  // LiveProjectEditor에서 보내는 editMode 변화 감지
  useEffect(() => {
    const handler = (e: Event) => {
      setEditMode((e as CustomEvent).detail.editMode)
    }
    window.addEventListener('edit-mode-change', handler)
    // 초기값도 body 클래스로 확인
    setEditMode(document.body.classList.contains('live-edit-mode'))
    return () => window.removeEventListener('edit-mode-change', handler)
  }, [])

  // 스크롤 reveal
  useEffect(() => {
    if (!gridRef.current || loading) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting)
          setTimeout(() => entry.target.classList.add('visible'), i * 100)
      })
    }, { threshold: 0.1 })
    gridRef.current.querySelectorAll('.work-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [projects, loading])

  function dispatchEdit(project: Project) {
    window.dispatchEvent(new CustomEvent('project-edit', { detail: { action: 'edit', project } }))
  }

  function dispatchAdd() {
    window.dispatchEvent(new CustomEvent('project-edit', { detail: { action: 'add' } }))
  }

  return (
    <section id="works" className="works-section">
      <div className="section-header site-wrapper">
        <h2 className="section-title">Selected Works</h2>
        <span className="section-count">{String(projects.length).padStart(2, '0')} Projects</span>
      </div>

      <div className="works-grid site-wrapper" ref={gridRef}>
        {loading && <div style={{ gridColumn:'1/-1', color:'var(--muted)', padding:'2rem' }}>Loading...</div>}
        {!loading && projects.length === 0 && (
          <div style={{ gridColumn:'1/-1', color:'var(--muted)', padding:'2rem' }}>등록된 프로젝트가 없습니다.</div>
        )}

        {projects.map((p, i) => (
          <div
            key={p.id}
            className={`work-item ${p.col_size}`}
            onClick={editMode ? () => dispatchEdit(p) : undefined}
            style={editMode ? { cursor:'pointer' } : undefined}
          >
            <div className="work-thumb" style={{ position:'relative' }}>
              {p.image_url
                ? <Image src={p.image_url} alt={p.title} fill style={{ objectFit:'cover' }} />
                : <div className="work-thumb-placeholder">{ROMAN[i] || i + 1}</div>
              }
            </div>
            <p className="work-tag">{p.tag}</p>
            <h3 className="work-title">{p.title}</h3>
            <span className="work-year">{p.year}</span>
          </div>
        ))}

        {/* 편집 모드: 새 프로젝트 추가 카드 */}
        {editMode && !loading && (
          <div
            className="work-item col-4"
            onClick={dispatchAdd}
            style={{ cursor:'pointer', opacity:1, transform:'none' }}
          >
            <div className="work-thumb" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'var(--border)', border:'2px dashed var(--accent)', position:'relative' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'2rem', color:'var(--accent)', lineHeight:1 }}>+</div>
                <span style={{ fontSize:'10px', color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>새 프로젝트</span>
              </div>
            </div>
            <p className="work-tag" style={{ color:'var(--accent)' }}>추가</p>
            <h3 className="work-title" style={{ color:'var(--muted)' }}>New Project</h3>
            <span className="work-year">—</span>
          </div>
        )}
      </div>
    </section>
  )
})

export default WorksGrid
