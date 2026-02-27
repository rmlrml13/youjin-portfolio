'use client'
// components/LiveEditPopup.tsx
import { useState, useEffect, useRef } from 'react'

interface Props {
  field: string
  label: string
  type: 'text' | 'textarea' | 'skills' | 'image'
  value: string
  saving: boolean
  onSave: (field: string, value: string) => void
  onSaveImage: (field: string, file: File) => void
  onClose: () => void
}

export default function LiveEditPopup({ field, label, type, value, saving, onSave, onSaveImage, onClose }: Props) {
  const [val, setVal]           = useState(value)
  const [preview, setPreview]   = useState(value)
  const [file, setFile]         = useState<File | null>(null)
  const inputRef  = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVal(value); setPreview(value); setFile(null)
    if (type !== 'image') setTimeout(() => inputRef.current?.focus(), 50)
  }, [field, value, type])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && type === 'text') onSave(field, val)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [field, val, type, onSave, onClose])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const hint: Record<string, string> = {
    hero_subtitle: '| 로 줄바꿈 (예: Design|& Art|Works)',
    about_skills:  '콤마(,)로 구분 (예: Branding,UI Design)',
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9100, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(2px)' }} />

      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%, -50%)',
        zIndex:9200, background:'#fff',
        width:'min(480px, 90vw)',
        boxShadow:'0 8px 40px rgba(0,0,0,0.18)',
        padding:'2rem',
      }}>
        {/* 헤더 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h3 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.2rem' }}>{label}</h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#888880' }}>✕</button>
        </div>

        {/* 이미지 타입 */}
        {type === 'image' && (
          <>
            {/* 미리보기 */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width:'100%', aspectRatio:'16/7', background:'#ECEAE4',
                overflow:'hidden', cursor:'pointer', marginBottom:'0.8rem',
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative',
              }}
            >
              {preview
                ? <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                : <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'2rem', color:'#C8B89A', marginBottom:'0.4rem' }}>↑</div>
                    <span style={{ fontSize:'11px', color:'#888880', letterSpacing:'0.08em', textTransform:'uppercase' }}>클릭하여 이미지 선택</span>
                  </div>
              }
              {preview && (
                <div style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity:0, transition:'opacity 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ color:'#fff', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>이미지 변경</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />

            {/* 이미지 제거 버튼 */}
            {(preview) && (
              <button
                onClick={() => { setPreview(''); setFile(null) }}
                style={{
                  width:'100%', padding:'0.5rem',
                  background:'transparent', color:'#C0392B',
                  fontFamily:'DM Mono, monospace', fontSize:'10px',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  border:'1px solid #C0392B', cursor:'pointer',
                  marginBottom:'0.8rem',
                }}>
                ✕ 이미지 제거
              </button>
            )}

            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button
                onClick={() => {
                  if (file) onSaveImage(field, file)
                  else onSave(field, '') // 제거
                }}
                disabled={saving || (preview === value && !file)}
                style={{
                  flex:1, padding:'0.75rem',
                  background:'#1A1A18', color:'#F5F4F0',
                  fontFamily:'DM Mono, monospace', fontSize:'11px',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  border:'none', cursor:'pointer',
                  opacity: (saving || (preview === value && !file)) ? 0.4 : 1,
                }}>
                {saving ? '업로드 중...' : '저장'}
              </button>
              <button onClick={onClose} style={{
                padding:'0.75rem 1.2rem', background:'transparent', color:'#1A1A18',
                fontFamily:'DM Mono, monospace', fontSize:'11px',
                letterSpacing:'0.1em', textTransform:'uppercase',
                border:'1px solid #E0DED8', cursor:'pointer',
              }}>취소</button>
            </div>
          </>
        )}

        {/* 텍스트 타입 */}
        {type !== 'image' && (
          <>
            {hint[field] && (
              <p style={{ fontSize:'10px', color:'#C8B89A', letterSpacing:'0.06em', marginBottom:'0.8rem' }}>
                💡 {hint[field]}
              </p>
            )}

            {type === 'textarea' || type === 'skills' ? (
              <textarea
                ref={inputRef as any}
                value={val}
                onChange={e => setVal(e.target.value)}
                style={{
                  width:'100%', padding:'0.75rem 1rem',
                  border:'1px solid #E0DED8', background:'#F5F4F0',
                  fontFamily:'DM Mono, monospace', fontSize:'13px',
                  color:'#1A1A18', outline:'none', resize:'vertical',
                  minHeight: type === 'skills' ? '60px' : '100px',
                  lineHeight:'1.6', boxSizing:'border-box',
                }}
              />
            ) : (
              <input
                ref={inputRef as any}
                type="text"
                value={val}
                onChange={e => setVal(e.target.value)}
                style={{
                  width:'100%', padding:'0.75rem 1rem',
                  border:'1px solid #E0DED8', background:'#F5F4F0',
                  fontFamily:'DM Mono, monospace', fontSize:'13px',
                  color:'#1A1A18', outline:'none', boxSizing:'border-box',
                }}
              />
            )}

            <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem' }}>
              <button
                onClick={() => onSave(field, val)}
                disabled={saving}
                style={{
                  flex:1, padding:'0.75rem',
                  background:'#1A1A18', color:'#F5F4F0',
                  fontFamily:'DM Mono, monospace', fontSize:'11px',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  border:'none', cursor:'pointer',
                  opacity: saving ? 0.6 : 1,
                }}>
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={onClose} style={{
                padding:'0.75rem 1.2rem', background:'transparent', color:'#1A1A18',
                fontFamily:'DM Mono, monospace', fontSize:'11px',
                letterSpacing:'0.1em', textTransform:'uppercase',
                border:'1px solid #E0DED8', cursor:'pointer',
              }}>취소</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
