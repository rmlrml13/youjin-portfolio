'use client'
// components/live-edit/QuickEditPanel.tsx
// 라이브 편집 전용 — 제목 · 태그(카테고리) · 썸네일만 수정
import { useState, useEffect, useRef } from 'react'

export type QuickEditTarget = {
  type: 'project' | 'insight'
  id: number
  title: string
  tag: string         // project.tag 또는 insight.category
  thumbnail: string   // image_url or thumbnail_url
}

interface Props {
  target: QuickEditTarget
  token: string
  onSaved: (updated: QuickEditTarget) => void
  onClose: () => void
}

export default function QuickEditPanel({ target, token, onSaved, onClose }: Props) {
  const [title,    setTitle]    = useState(target.title)
  const [tag,      setTag]      = useState(target.tag)
  const [imgFile,  setImgFile]  = useState<File | null>(null)
  const [imgPrev,  setImgPrev]  = useState(target.thumbnail)
  const [imgHover, setImgHover] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(target.title)
    setTag(target.tag)
    setImgFile(null)
    setImgPrev(target.thumbnail)
  }, [target.id, target.type])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImgPrev(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSave() {
    if (!title.trim()) { alert('제목은 필수입니다.'); return }
    setSaving(true)

    let thumbnailUrl: string = imgPrev

    if (imgFile) {
      const folder = target.type === 'project' ? 'projects' : 'insights'
      const fd = new FormData()
      fd.append('image', imgFile)
      const up = await fetch(`/api/upload?folder=${folder}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!up.ok) { setSaving(false); alert('이미지 업로드 실패'); return }
      thumbnailUrl = (await up.json()).url
    }

    let res: Response
    if (target.type === 'project') {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('tag', tag)
      fd.append('col_size', 'col-6')
      if (imgFile) fd.append('image', imgFile)
      if (!imgPrev && !imgFile) fd.append('image_url', '')
      res = await fetch(`/api/projects/${target.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
    } else {
      res = await fetch(`/api/insights/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category: tag, thumbnail_url: thumbnailUrl }),
      })
    }

    setSaving(false)
    if (res.ok) {
      onSaved({ ...target, title, tag, thumbnail: thumbnailUrl })
    } else {
      const e = await res.json(); alert('저장 실패: ' + e.error)
    }
  }

  const isProject = target.type === 'project'
  const tagLabel  = isProject ? '태그' : '카테고리'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(400px, 100vw)', zIndex: 9200,
        background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
      }}>

        {/* 헤더 */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E0DED8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8B89A', margin: 0 }}>
              {isProject ? 'Project' : 'Insight'} · 빠른 편집
            </p>
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1rem', margin: '0.2rem 0 0', color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
              {title || '—'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888880' }}>✕</button>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* 썸네일 */}
          <label style={st.label}>썸네일</label>
          <div
            style={{ width: '100%', aspectRatio: '3/4', background: '#ECEAE4', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: imgPrev ? 'default' : 'pointer', marginBottom: '1.5rem' }}
            onClick={() => { if (!imgPrev) fileRef.current?.click() }}
            onMouseEnter={() => setImgHover(true)}
            onMouseLeave={() => setImgHover(false)}
          >
            {imgPrev
              ? <img src={imgPrev} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', color: '#C8B89A', marginBottom: '0.3rem' }}>↑</div>
                  <span style={{ fontSize: '10px', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>클릭하여 업로드</span>
                </div>
            }
            {imgPrev && imgHover && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <button onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                  style={st.overlayBtn}>변경</button>
                <button onClick={e => { e.stopPropagation(); setImgPrev(''); setImgFile(null) }}
                  style={{ ...st.overlayBtn, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.7)' }}>제거</button>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* 제목 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={st.label}>제목 *</label>
            <input style={st.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="제목 입력" />
          </div>

          {/* 태그 / 카테고리 */}
          <div>
            <label style={st.label}>{tagLabel}</label>
            <input style={st.input} value={tag} onChange={e => setTag(e.target.value)} placeholder={isProject ? 'Branding' : 'Design'} />
          </div>

        </div>

        {/* 하단 버튼 영역 */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E0DED8', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '0.8rem', background: '#1A1A18', color: '#fff', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        {/* 관리자 페이지 안내 */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #E0DED8', flexShrink: 0, background: '#F5F4F0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#888880', letterSpacing: '0.04em' }}>
            콘텐츠 편집은{' '}
            <a
              href="/admin"
              style={{ color: '#A0845C', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer' }}
            >
              관리자 페이지
            </a>
            에서 가능합니다.
          </p>
        </div>
      </div>
    </>
  )
}

const st: Record<string, React.CSSProperties> = {
  label: { display: 'block', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888880', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #E0DED8', background: '#F5F4F0', fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#1A1A18', outline: 'none', boxSizing: 'border-box' as const },
  overlayBtn: { padding: '0.35rem 1.1rem', background: '#fff', color: '#1A1A18', border: 'none', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', width: '80px' },
}
