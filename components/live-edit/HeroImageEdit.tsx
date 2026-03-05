'use client'
// components/live-edit/HeroImageEdit.tsx
// hero 영역 배경 이미지 업로드/변경/제거 전용
import { useState, useEffect, useRef } from 'react'

interface Props {
  configKey: string
  initialUrl: string
  children?: React.ReactNode
}

export default function HeroImageEdit({ configKey, initialUrl, children }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [imgUrl,   setImgUrl]   = useState(initialUrl)
  const [imgPanel, setImgPanel] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setEditMode(document.body.classList.contains('live-edit-mode'))
    )
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    setEditMode(document.body.classList.contains('live-edit-mode'))
    return () => observer.disconnect()
  }, [])

  useEffect(() => { if (!editMode) setImgPanel(false) }, [editMode])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setSaving(true)
    const token = localStorage.getItem('youjin_token') ?? ''
    const fd = new FormData()
    fd.append('image', file)
    const up = await fetch('/api/upload?folder=hero', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    })
    if (!up.ok) { setSaving(false); alert('업로드 실패'); return }
    const { url } = await up.json()
    await saveCfg(configKey, url)
    setImgUrl(url)
    setSaving(false)
    setImgPanel(false)
  }

  async function handleRemove() {
    if (!confirm('이미지를 제거할까요?')) return
    setSaving(true)
    await saveCfg(configKey, '')
    setImgUrl('')
    setSaving(false)
  }

  async function saveCfg(key: string, value: string) {
    const token = localStorage.getItem('youjin_token') ?? ''
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [key]: value }),
    })
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* 배경 이미지 */}
      {imgUrl && (
        <img
          src={imgUrl} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
        />
      )}

      {/* 콘텐츠 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {children}
      </div>

      {/* 이미지 편집 패널 */}
      {editMode && imgPanel && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
        }}>
          {saving ? (
            <span style={{ color: '#fff', fontSize: '11px', letterSpacing: '0.1em' }}>저장 중...</span>
          ) : (
            <>
              <button onClick={() => fileRef.current?.click()} style={bs('#fff', '#1A1A18')}>
                {imgUrl ? '이미지 변경' : '+ 이미지 등록'}
              </button>
              {imgUrl && <button onClick={handleRemove} style={bs('transparent', '#fff', 'rgba(255,255,255,0.6)')}>이미지 제거</button>}
              <button onClick={() => setImgPanel(false)} style={{ ...bs('transparent', 'rgba(255,255,255,0.45)'), fontSize: '10px' }}>취소</button>
            </>
          )}
        </div>
      )}

      {/* 이미지 버튼 */}
      {editMode && !imgPanel && (
        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 20 }}>
          <button onClick={() => setImgPanel(true)} style={bs('rgba(0,0,0,0.55)', '#fff')}>
            {imgUrl ? '✏ 이미지' : '+ 이미지'}
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

function bs(bg: string, color: string, border?: string): React.CSSProperties {
  return {
    padding: '0.4rem 1rem', background: bg, color,
    border: border ? `1px solid ${border}` : 'none',
    fontFamily: 'DM Mono, monospace', fontSize: '11px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}
