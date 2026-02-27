'use client'
// components/ProjectEditPanel.tsx
// 라이브 편집 모드에서 프로젝트를 수정/추가하는 슬라이드 패널

import { useState, useEffect, useRef } from 'react'
import type { Project } from '@/lib/types'

const COL_OPTIONS = [
  { value: 'col-4', label: '좁게' },
  { value: 'col-5', label: '보통' },
  { value: 'col-6', label: '중간' },
  { value: 'col-7', label: '넓게' },
  { value: 'col-8', label: '아주 넓게' },
]

interface Props {
  project: Project | null   // null = 새 프로젝트
  token: string
  onSaved: () => void
  onDeleted: () => void
  onClose: () => void
}

export default function ProjectEditPanel({ project, token, onSaved, onDeleted, onClose }: Props) {
  const isNew = !project

  const [form, setForm] = useState({
    title:      project?.title      ?? '',
    tag:        project?.tag        ?? '',
    year:       project?.year       ?? String(new Date().getFullYear()),
    col_size:   project?.col_size   ?? 'col-6',
    sort_order: project?.sort_order ?? 0,
  })
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(project?.image_url ?? '')
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // project 바뀌면 폼 리셋
  useEffect(() => {
    setForm({
      title:      project?.title      ?? '',
      tag:        project?.tag        ?? '',
      year:       project?.year       ?? String(new Date().getFullYear()),
      col_size:   project?.col_size   ?? 'col-6',
      sort_order: project?.sort_order ?? 0,
    })
    setImageFile(null)
    setImagePreview(project?.image_url ?? '')
  }, [project])

  // ESC 닫기
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setImageFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSave() {
    if (!form.title || !form.tag || !form.year) { alert('제목, 태그, 연도는 필수예요.'); return }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (imageFile) fd.append('image', imageFile)

    const url    = isNew ? '/api/projects' : `/api/projects/${project!.id}`
    const method = isNew ? 'POST' : 'PUT'
    const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd })
    setSaving(false)
    if (res.ok) { onSaved() }
    else { const e = await res.json(); alert('저장 실패: ' + e.error) }
  }

  async function handleDelete() {
    if (!project || !confirm(`"${project.title}" 프로젝트를 삭제할까요?`)) return
    setDeleting(true)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    setDeleting(false)
    if (res.ok) { onDeleted() }
  }

  return (
    <>
      {/* 딤 배경 */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:9100,
        background:'rgba(0,0,0,0.25)',
      }} />

      {/* 슬라이드 패널 */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width: 'min(420px, 100vw)',
        zIndex:9200,
        background:'#fff',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
        display:'flex', flexDirection:'column',
        animation:'slideIn 0.25s ease',
      }}>
        {/* 패널 헤더 */}
        <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid #E0DED8', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <p style={{ fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#888880', margin:0 }}>
              {isNew ? '새 프로젝트' : '프로젝트 수정'}
            </p>
            <h3 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.1rem', margin:'0.2rem 0 0' }}>
              {isNew ? 'New Project' : form.title || '—'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#888880' }}>✕</button>
        </div>

        {/* 스크롤 영역 */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 2rem' }}>
          {/* 이미지 */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width:'100%', aspectRatio:'4/3', background:'#ECEAE4', overflow:'hidden', marginBottom:'1rem', cursor:'pointer', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            {imagePreview
              ? <img src={imagePreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', color:'#C8B89A', marginBottom:'0.3rem' }}>↑</div>
                  <span style={{ fontSize:'10px', color:'#888880', letterSpacing:'0.08em', textTransform:'uppercase' }}>이미지 업로드</span>
                </div>
            }
            {imagePreview && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                onMouseLeave={e => (e.currentTarget.style.opacity='0')}>
                <span style={{ color:'#fff', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>이미지 변경</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />

          {[
            { label:'제목 *', key:'title', placeholder:'Project Title' },
            { label:'태그 *', key:'tag',   placeholder:'Branding · Identity' },
            { label:'연도 *', key:'year',  placeholder:'2025' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:'1rem' }}>
              <label style={ls.label}>{f.label}</label>
              <input style={ls.input} placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          {/* 카드 크기 */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={ls.label}>카드 크기</label>
            <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
              {COL_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setForm(p => ({ ...p, col_size: o.value }))}
                  style={{
                    padding:'0.35rem 0.8rem',
                    background: form.col_size === o.value ? '#1A1A18' : 'transparent',
                    color:      form.col_size === o.value ? '#F5F4F0' : '#888880',
                    fontFamily:'DM Mono, monospace', fontSize:'10px',
                    letterSpacing:'0.08em', textTransform:'uppercase',
                    border:`1px solid ${form.col_size === o.value ? '#1A1A18' : '#E0DED8'}`,
                    cursor:'pointer',
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 순서 */}
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={ls.label}>정렬 순서</label>
            <input style={ls.input} type="number" min={0} placeholder="0"
              value={form.sort_order}
              onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ padding:'1.2rem 2rem', borderTop:'1px solid #E0DED8', display:'flex', gap:'0.5rem', flexShrink:0 }}>
          <button onClick={handleSave} disabled={saving} style={{
            flex:1, padding:'0.75rem',
            background:'#1A1A18', color:'#F5F4F0',
            fontFamily:'DM Mono, monospace', fontSize:'11px',
            letterSpacing:'0.1em', textTransform:'uppercase',
            border:'none', cursor:'pointer', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '저장 중...' : (isNew ? '추가' : '저장')}
          </button>
          {!isNew && (
            <button onClick={handleDelete} disabled={deleting} style={{
              padding:'0.75rem 1rem',
              background:'transparent', color:'#C0392B',
              fontFamily:'DM Mono, monospace', fontSize:'11px',
              letterSpacing:'0.1em', textTransform:'uppercase',
              border:'1px solid #C0392B', cursor:'pointer',
              opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? '...' : '삭제'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

const ls: Record<string, React.CSSProperties> = {
  label: { display:'block', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#888880', marginBottom:'0.4rem' },
  input: { width:'100%', padding:'0.7rem 1rem', border:'1px solid #E0DED8', background:'#F5F4F0', fontFamily:'DM Mono, monospace', fontSize:'13px', color:'#1A1A18', outline:'none', boxSizing:'border-box' as const },
}
