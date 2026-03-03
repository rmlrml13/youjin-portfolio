'use client'
// components/portfolio/PortfolioEditPanel.tsx
import { useState, useEffect, useRef } from 'react'
import type { Project } from '@/lib/types'
import BlockEditor from './BlockEditor'

type Tab = 'info' | 'blocks'

interface Props {
  project: Project | null
  token: string
  onSaved: () => void
  onDeleted: () => void
  onClose: () => void
}

export default function PortfolioEditPanel({ project, token, onSaved, onDeleted, onClose }: Props) {
  const isNew = !project
  const [tab, setTab] = useState<Tab>('info')

  const [form, setForm] = useState({
    title:       project?.title       ?? '',
    tag:         project?.tag         ?? '',
    sort_order:  project?.sort_order  ?? 0,
    description: project?.description ?? '',
  })
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(project?.image_url ?? '')
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTab('info')
    setForm({
      title:       project?.title       ?? '',
      tag:         project?.tag         ?? '',
      sort_order:  project?.sort_order  ?? 0,
      description: project?.description ?? '',
    })
    setImageFile(null)
    setImagePreview(project?.image_url ?? '')
  }, [project])

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
    if (!form.title || !form.tag) { alert('제목, 태그는 필수예요.'); return }
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    fd.append('col_size', 'col-6') // 고정값, 더 이상 UI에서 선택 안 함
    if (imageFile) fd.append('image', imageFile)
    const url    = isNew ? '/api/projects' : `/api/projects/${project!.id}`
    const method = isNew ? 'POST' : 'PUT'
    const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd })
    setSaving(false)
    if (res.ok) onSaved()
    else { const e = await res.json(); alert('저장 실패: ' + e.error) }
  }

  async function handleDelete() {
    if (!project || !confirm(`"${project.title}" 프로젝트를 삭제할까요?`)) return
    setDeleting(true)
    const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setDeleting(false)
    if (res.ok) onDeleted()
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9100, background:'rgba(0,0,0,0.25)' }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'min(480px, 100vw)', zIndex:9200, background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column', animation:'slideIn 0.25s ease' }}>

        {/* 헤더 */}
        <div style={{ padding:'1.25rem 2rem', borderBottom:'1px solid #E0DED8', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <p style={{ fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#888880', margin:0 }}>
              {isNew ? '새 프로젝트' : '프로젝트 수정'}
            </p>
            <h3 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.05rem', margin:'0.2rem 0 0', color:'#1A1A18' }}>
              {isNew ? 'New Project' : form.title || '—'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#888880' }}>✕</button>
        </div>

        {/* 탭 — 수정 모드에서만 표시 */}
        {!isNew && (
          <div style={{ display:'flex', borderBottom:'1px solid #E0DED8', flexShrink:0 }}>
            {([['info', '기본 정보'], ['blocks', '콘텐츠 블록']] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex:1, padding:'0.75rem', background:'none', border:'none',
                  borderBottom: tab === t ? '2px solid #1A1A18' : '2px solid transparent',
                  fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.08em',
                  textTransform:'uppercase', color: tab === t ? '#1A1A18' : '#888880',
                  cursor:'pointer', transition:'color 0.15s',
                  marginBottom:'-1px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* 스크롤 영역 */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.5rem 2rem' }}>

          {/* ── 기본 정보 탭 ── */}
          {tab === 'info' && (
            <>
              {/* 썸네일 */}
              <p style={ls.sectionLabel}>썸네일 (대표 이미지)</p>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ width:'100%', aspectRatio:'4/3', background:'#ECEAE4', overflow:'hidden', marginBottom:'1.5rem', cursor:'pointer', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}
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

              {/* 기본 필드 */}
              <p style={ls.sectionLabel}>기본 정보</p>
              {[
                { label:'제목 *',     key:'title',  placeholder:'Project Title' },
                { label:'태그 *',     key:'tag',    placeholder:'Branding · Identity' },
                { label:'연도 *',     key:'year',   placeholder:'2025' },
                { label:'클라이언트', key:'client', placeholder:'Client Name' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:'1rem' }}>
                  <label style={ls.label}>{f.label}</label>
                  <input style={ls.input} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}

              <div style={{ marginBottom:'1rem' }}>
                <label style={ls.label}>프로젝트 설명</label>
                <textarea
                  style={{ ...ls.input, height:'80px', resize:'vertical' as const }}
                  placeholder="상세 페이지 상단에 표시되는 소개글"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom:'2rem' }}>
                <label style={ls.label}>정렬 순서</label>
                <input style={ls.input} type="number" min={0} placeholder="0" value={form.sort_order}
                  onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
            </>
          )}

          {/* ── 콘텐츠 블록 탭 ── */}
          {tab === 'blocks' && project && (
            <BlockEditor projectId={project.id} token={token} />
          )}
        </div>

        {/* 하단 버튼 — 기본 정보 탭에서만 */}
        {tab === 'info' && (
          <div style={{ padding:'1.2rem 2rem', borderTop:'1px solid #E0DED8', display:'flex', gap:'0.5rem', flexShrink:0 }}>
            <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'0.75rem', background:'#1A1A18', color:'#F5F4F0', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : (isNew ? '추가' : '저장')}
            </button>
            {!isNew && (
              <button onClick={handleDelete} disabled={deleting} style={{ padding:'0.75rem 1rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid #C0392B', cursor:'pointer', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? '...' : '삭제'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

const ls: Record<string, React.CSSProperties> = {
  sectionLabel: { fontSize:'9px', letterSpacing:'0.16em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.8rem', display:'block' },
  label:  { display:'block', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#888880', marginBottom:'0.4rem' },
  input:  { width:'100%', padding:'0.7rem 1rem', border:'1px solid #E0DED8', background:'#F5F4F0', fontFamily:'DM Mono, monospace', fontSize:'13px', color:'#1A1A18', outline:'none', boxSizing:'border-box' as const },
}
