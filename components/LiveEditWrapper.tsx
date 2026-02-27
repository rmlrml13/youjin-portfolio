'use client'
// components/LiveEditWrapper.tsx
import { useState, useEffect, useCallback } from 'react'
import type { SiteConfig } from '@/lib/types'
import LiveEditPopup from './LiveEditPopup'

interface Props {
  initialConfig: SiteConfig
}

type PopupType = 'text' | 'textarea' | 'skills' | 'image'

export default function LiveEditWrapper({ initialConfig }: Props) {
  const [isAdmin, setIsAdmin]   = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [config, setConfig]     = useState(initialConfig)
  const [popup, setPopup]       = useState<{ field: string; label: string; type: PopupType } | null>(null)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  useEffect(() => {
    if (!localStorage.getItem('yujin_token')) return
    setIsAdmin(true)
    document.body.classList.add('has-edit-bar')
    if (new URLSearchParams(window.location.search).get('edit') === '1') {
      setEditMode(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
    return () => document.body.classList.remove('has-edit-bar')
  }, [])

  useEffect(() => {
    if (editMode) document.body.classList.add('live-edit-mode')
    else { document.body.classList.remove('live-edit-mode'); setPopup(null); }
    return () => document.body.classList.remove('live-edit-mode')
  }, [editMode])

  useEffect(() => {
    if (!editMode) return
    function handleClick(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest('[data-edit]') as HTMLElement | null
      if (!el) return
      e.preventDefault(); e.stopPropagation()
      setPopup({
        field: el.dataset.edit!,
        label: el.dataset.label || el.dataset.edit!,
        type:  (el.dataset.type || 'text') as PopupType,
      })
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [editMode])

  const updateTextDOM = useCallback((field: string, value: string) => {
    document.querySelectorAll<HTMLElement>(`[data-edit="${field}"]`).forEach(el => {
      const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE)
      if (textNode) textNode.textContent = value
      else el.textContent = value
    })
  }, [])

  const updateImageDOM = useCallback((field: string, url: string) => {
    document.querySelectorAll<HTMLElement>(`[data-edit="${field}"]`).forEach(el => {
      const img = el.querySelector('img')
      if (url) {
        if (img) { img.src = url }
        else {
          const newImg = document.createElement('img')
          newImg.src = url
          newImg.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;'
          el.innerHTML = ''; el.appendChild(newImg)
        }
        el.style.background = 'transparent'
      } else {
        el.innerHTML = ''; el.style.background = '#E0DED8'
      }
    })
  }, [])

  const saveField = useCallback(async (field: string, value: string) => {
    setSaving(true)
    const t   = localStorage.getItem('yujin_token')
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ [field]: value }),
    })
    setSaving(false)
    if (res.ok) {
      setConfig(prev => ({ ...prev, [field]: value }))
      updateTextDOM(field, value)
      setPopup(null)
      showToast('✓ 저장 완료')
    } else { alert('저장 실패') }
  }, [updateTextDOM])

  const saveImage = useCallback(async (field: string, file: File) => {
    setSaving(true)
    const t  = localStorage.getItem('yujin_token')
    const fd = new FormData()
    fd.append('image', file)
    const uploadRes  = await fetch('/api/upload', { method:'POST', headers:{ Authorization:`Bearer ${t}` }, body:fd })
    const uploadData = await uploadRes.json()
    if (!uploadRes.ok) { setSaving(false); alert('이미지 업로드 실패: ' + uploadData.error); return }

    const configRes = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ [field]: uploadData.url }),
    })
    setSaving(false)
    if (configRes.ok) {
      setConfig(prev => ({ ...prev, [field]: uploadData.url }))
      updateImageDOM(field, uploadData.url)
      setPopup(null)
      showToast('✓ 이미지 저장 완료')
    } else { alert('설정 저장 실패') }
  }, [updateImageDOM])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  if (!isAdmin) return null

  return (
    <>
      {/* 편집 바 — 상단 고정 */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:9000,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background: editMode ? '#1A1A18' : 'rgba(26,26,24,0.92)',
        backdropFilter:'blur(12px)',
        padding:'0.6rem 1.5rem',
        borderBottom: editMode ? '1px solid #C8B89A' : '1px solid rgba(255,255,255,0.08)',
        transition:'border-color 0.3s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: editMode ? '#C8B89A' : 'rgba(255,255,255,0.25)', transition:'background 0.3s' }} />
          <span style={{ color: editMode ? '#C8B89A' : 'rgba(255,255,255,0.45)', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            {editMode ? '편집 모드 — 수정할 항목을 클릭하세요' : '관리자 모드'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <a href="/admin" style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', letterSpacing:'0.08em', textDecoration:'none', textTransform:'uppercase', padding:'0.35rem 0.8rem' }}>
            관리자
          </a>
          <button onClick={() => setEditMode(m => !m)} style={{
            padding:'0.35rem 1rem',
            background: editMode ? 'transparent' : '#C8B89A',
            color: editMode ? '#C8B89A' : '#1A1A18',
            fontFamily:'DM Mono, monospace', fontSize:'10px',
            letterSpacing:'0.1em', textTransform:'uppercase',
            border: editMode ? '1px solid #C8B89A' : 'none',
            cursor:'pointer', transition:'all 0.2s',
          }}>
            {editMode ? '편집 종료' : '✏ 라이브 편집'}
          </button>
        </div>
      </div>

      <div style={{ height: 38 }} />

      {/* 텍스트/이미지 팝업 */}
      {popup && (
        <LiveEditPopup
          field={popup.field}
          label={popup.label}
          type={popup.type}
          value={(config as any)[popup.field] ?? ''}
          saving={saving}
          onSave={saveField}
          onSaveImage={saveImage}
          onClose={() => setPopup(null)}
        />
      )}

      {toast && (
        <div style={{
          position:'fixed', top:'4rem', left:'50%', transform:'translateX(-50%)',
          zIndex:9999, background:'#1A1A18', color:'#F5F4F0',
          padding:'0.6rem 1.5rem', fontSize:'11px', letterSpacing:'0.08em',
          pointerEvents:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
