'use client'
// components/portfolio/BlockEditor.tsx
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { ProjectBlock } from '@/lib/types'

export interface BlockEditorHandle {
  flush: () => Promise<void>
}

interface Props {
  projectId: number
  token: string
  apiBase?: string
}

const BLOCK_TYPES = [
  { type: 'heading', label: '제목', icon: 'H'  },
  { type: 'text',    label: '본문', icon: '¶'  },
  { type: 'image',   label: '이미지', icon: '▣' },
  { type: 'divider', label: '구분선', icon: '—' },
] as const

const BlockEditor = forwardRef<BlockEditorHandle, Props>(function BlockEditor({ projectId, token, apiBase = '/api/projects' }, ref) {
  const [blocks,     setBlocks]     = useState<ProjectBlock[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState<number | null>(null)
  const [editingId,  setEditingId]  = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const editingIdRef   = { current: null as number | null }
  const editContentRef = { current: '' }
  const base = `${apiBase}/${projectId}/blocks`

  useImperativeHandle(ref, () => ({
    async flush() {
      const id = editingIdRef.current
      if (id == null) return
      await fetch(`${base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContentRef.current }),
      })
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: editContentRef.current } : b))
      setEditingId(null)
    }
  }))

  useEffect(() => { loadBlocks() }, [projectId])

  async function loadBlocks() {
    setLoading(true)
    const res  = await fetch(base)
    const data = await res.json()
    setBlocks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function addBlock(type: ProjectBlock['type']) {
    if (type === 'image') {
      const input = document.createElement('input')
      input.type = 'file'; input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const fd = new FormData()
        fd.append('image', file)
        fd.append('sort_order', String(blocks.length))
        const res = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
        if (res.ok) { const b = await res.json(); setBlocks(prev => [...prev, b]) }
      }
      input.click()
      return
    }
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, content: '', sort_order: blocks.length }),
    })
    if (res.ok) {
      const b = await res.json()
      setBlocks(prev => [...prev, b])
      if (type !== 'divider') { setEditingId(b.id); setEditContent('') }
    }
  }

  async function saveBlock(blockId: number, content: string) {
    setSaving(blockId)
    await fetch(`${base}/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    })
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b))
    setSaving(null)
    setEditingId(null)
  }

  async function deleteBlock(blockId: number) {
    if (!confirm('이 블록을 삭제할까요?')) return
    await fetch(`${base}/${blockId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  async function moveBlock(blockId: number, dir: 'up' | 'down') {
    const idx = blocks.findIndex(b => b.id === blockId)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === blocks.length - 1) return
    const newBlocks = [...blocks]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]
    const updated = newBlocks.map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(updated)
    await Promise.all([
      fetch(`${base}/${updated[idx].id}`,     { method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ sort_order: updated[idx].sort_order }) }),
      fetch(`${base}/${updated[swapIdx].id}`, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ sort_order: updated[swapIdx].sort_order }) }),
    ])
  }

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '11px', letterSpacing: '0.1em' }}>
      블록 불러오는 중...
    </div>
  )

  return (
    /* 블록 에디터 + 오른쪽 사이드바 래퍼 */
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

      {/* 왼쪽: 블록 목록 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {blocks.length === 0 && (
            <div style={{ border: '1.5px dashed #D0CEC8', padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.3rem' }}>아직 블록이 없어요</p>
              <p style={{ fontSize: '11px', color: '#aaa' }}>우측 버튼으로 블록을 추가해보세요</p>
            </div>
          )}

          {blocks.map((block, idx) => (
            <div key={block.id} style={{ border: '1px solid #D0CEC8', background: '#FAFAF8' }}>
              {/* 블록 헤더 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.75rem', background: '#F0EEE8',
                borderBottom: editingId === block.id || block.type === 'image' || block.type === 'divider' ? '1px solid #D0CEC8' : 'none',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', flex: 1 }}>
                  {block.type === 'heading' ? 'H  제목' : block.type === 'text' ? '¶  본문' : block.type === 'image' ? '▣  이미지' : '—  구분선'}
                </span>
                <button onClick={() => moveBlock(block.id, 'up')}   disabled={idx === 0}               style={btnStyle(idx === 0)}>↑</button>
                <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length-1} style={btnStyle(idx === blocks.length-1)}>↓</button>
                {(block.type === 'text' || block.type === 'heading') && editingId !== block.id && (
                  <button onClick={() => { setEditingId(block.id); setEditContent(block.content) }} style={{ ...btnStyle(false), color: '#1A1A18' }}>✏</button>
                )}
                <button onClick={() => deleteBlock(block.id)} style={{ ...btnStyle(false), color: '#C0392B' }}>✕</button>
              </div>

              {/* 블록 내용 */}
              {block.type === 'divider' && (
                <div style={{ padding: '0.75rem 1rem' }}>
                  <hr style={{ border: 'none', borderTop: '1px solid #D0CEC8' }} />
                </div>
              )}

              {block.type === 'image' && (
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#ECEAE4', overflow: 'hidden' }}>
                  <img src={block.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {(block.type === 'heading' || block.type === 'text') && (
                editingId === block.id ? (
                  <div style={{ padding: '0.75rem' }}>
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={e => { setEditContent(e.target.value); editContentRef.current = e.target.value }}
                      placeholder={block.type === 'heading' ? '제목을 입력하세요' : '본문을 입력하세요...'}
                      style={{
                        width: '100%', minHeight: block.type === 'heading' ? '48px' : '100px',
                        padding: '0.6rem 0.8rem', border: '1px solid #C8B89A',
                        background: '#fff',
                        fontFamily: block.type === 'heading' ? 'DM Serif Display, serif' : 'DM Mono, monospace',
                        fontSize: block.type === 'heading' ? '1.1rem' : '13px',
                        color: '#1A1A18', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => saveBlock(block.id, editContent)}
                        disabled={saving === block.id}
                        style={{ padding: '0.45rem 1rem', background: '#1A1A18', color: '#fff', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: saving === block.id ? 0.5 : 1 }}
                      >
                        {saving === block.id ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ padding: '0.45rem 0.8rem', background: 'transparent', color: '#555', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid #D0CEC8', cursor: 'pointer' }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { setEditingId(block.id); setEditContent(block.content) }}
                    style={{ padding: '0.75rem 1rem', cursor: 'text', minHeight: '2.5rem' }}
                  >
                    {block.content
                      ? <span style={{ fontFamily: block.type === 'heading' ? 'DM Serif Display, serif' : 'DM Mono, monospace', fontSize: block.type === 'heading' ? '1rem' : '12px', color: '#1A1A18', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {block.content}
                        </span>
                      : <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                          클릭하여 {block.type === 'heading' ? '제목' : '본문'} 입력...
                        </span>
                    }
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽: 블록 추가 세로 사이드바 */}
      <div style={{
        flexShrink: 0,
        width: '72px',
        position: 'sticky',
        top: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        border: '1px solid #D0CEC8',
        overflow: 'hidden',
      }}>
        <p style={{
          fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#888', textAlign: 'center',
          padding: '0.5rem 0.25rem',
          background: '#F0EEE8',
          borderBottom: '1px solid #D0CEC8',
          margin: 0,
        }}>추가</p>

        {BLOCK_TYPES.map(({ type, label, icon }, i) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0.3rem',
              width: '100%', height: '64px',
              background: 'transparent', color: '#444',
              fontFamily: 'DM Mono, monospace', fontSize: '10px',
              letterSpacing: '0.04em',
              border: 'none',
              borderTop: i > 0 ? '1px solid #D0CEC8' : 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#1A1A18'
              el.style.color = '#fff'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = '#444'
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1, fontFamily: 'monospace' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

    </div>
  )
})

export default BlockEditor

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? '#CCC' : '#666', fontSize: '13px',
    padding: '0.15rem 0.3rem', lineHeight: 1,
  }
}
