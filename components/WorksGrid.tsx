'use client'
// components/WorksGrid.tsx
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Project } from '@/lib/types'

const ROMAN = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']

export default function WorksGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        // 배열이 아닌 경우(에러 객체 등) 방어 처리
        setProjects(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => { setProjects([]); setLoading(false) })
  }, [])

  // 스크롤 reveal
  useEffect(() => {
    if (!gridRef.current) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 100)
        }
      })
    }, { threshold: 0.1 })

    gridRef.current.querySelectorAll('.work-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [projects])

  return (
    <section id="works" className="works-section">
      <div className="section-header site-wrapper">
        <h2 className="section-title">Selected Works</h2>
        <span className="section-count">
          {String(projects.length).padStart(2, '0')} Projects
        </span>
      </div>

      <div className="works-grid site-wrapper" ref={gridRef}>
        {loading && (
          <div style={{ gridColumn: '1/-1', color: 'var(--muted)', padding: '2rem' }}>
            Loading...
          </div>
        )}
        {!loading && projects.length === 0 && (
          <div style={{ gridColumn: '1/-1', color: 'var(--muted)', padding: '2rem' }}>
            등록된 프로젝트가 없습니다.
          </div>
        )}
        {projects.map((p, i) => (
          <div key={p.id} className={`work-item ${p.col_size}`}>
            <div className="work-thumb">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div className="work-thumb-placeholder">{ROMAN[i] || i + 1}</div>
              )}
            </div>
            <p className="work-tag">{p.tag}</p>
            <h3 className="work-title">{p.title}</h3>
            <span className="work-year">{p.year}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
