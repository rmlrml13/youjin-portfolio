'use client'
// components/portfolio/BlockEditor.tsx
// Admin 패널 내 블록 에디터 — 텍스트/이미지/제목/구분선 블록 관리
import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { ProjectBlock } from '@/lib/types'

export interface BlockEditorHandle {
  /** 현재 편집 중인 블록이 있으면 저장 후 resolve */
  flush: () => Promise<void>
}

interface Props {
  projectId: number
  token: string
  apiBase?: string
}

const BLOCK_TYPES = [
  { type: 'heading',  label: 'H  제목',     icon: 'H' },
  { type: 'text',     label: '¶  본문',     icon: '¶' },
  { type: 'image',    label: '⬜ 이미지',   icon: '⬜' },
  { type: 'divider',  label: '—  구분선',   icon: '—' },
] as const

const BlockEditor = forwardRef<BlockEditorHandle, Props>(function BlockEditor({ projectId, token, apiBase = '/api/projects' }, ref) {
  const [blocks, setBlocks]     = useState<ProjectBlock[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<number | null>(null) // blockId
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const imgRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const base = `${apiBase}/${projectId}/blocks`
  // 편집 중 콘텐츠를 ref로 노cd9c (flush에서 사용)
  const editingIdRef    = useRef<number | null>(null)
  const editContentRef  = useRef<string>('')

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
      editingIdRef.current = null
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

  // ── 블록 추가 ──
  async function addBlock(type: ProjectBlock['type']) {
    if (type === 'image') {
      // 이미지는 파일 선택 트리거
      const input = document.createElement('input')
      input.type = 'file'; input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const fd = new FormData()
        fd.append('image', file)
        fd.append('sort_order', String(blocks.length))
        const res = await fetch(base, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
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
      // 텍스트/heading은 바로 편집 모드
      if (type !== 'divider') { setEditingId(b.id); setEditContent(''); editingIdRef.current = b.id; editContentRef.current = '' }
    }
  }

  // ── 블록 내용 저장 ──
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
    editingIdRef.current = null
  }

  // ── 블록 삭제 ──
  async function deleteBlock(blockId: number) {
    if (!confirm('이 블록을 삭제할까요?')) return
    await fetch(`${base}/${blockId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  // ── 순서 이동 ──
  async function moveBlock(blockId: number, dir: 'up' | 'down') {
    const idx = blocks.findIndex(b => b.id === blockId)
    if (dir === 'up'   && idx === 0)               return
    if (dir === 'down' && idx === blocks.length - 1) return

    const newBlocks = [...blocks]
    const swapIdx   = dir === 'up' ? idx - 1 : idx + 1
    ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]

    // sort_order 업데이트
    const updated = newBlocks.map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(updated)

    // 두 블록만 서버에 저장
    await Promise.all([
      fetch(`${base}/${updated[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sort_order: updated[idx].sort_order }),
      }),
      fetch(`${base}/${updated[swapIdx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sort_order: updated[swapIdx].sort_order }),
      }),
    ])
  }

  if (loading) return (
    <div style={{ padding:'2rem', textAlign:'center', color:'#888880', fontSize:'11px', letterSpacing:'0.1em' }}>
      블록 불러오는 중...
    </div>
  )

  return (
    <div>
      {/* 블록 목록 */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {blocks.length === 0 && (
          <div style={{ border:'1.5px dashed #E0DED8', padding:'2.5rem', textAlign:'center', color:'#C8B89A' }}>
            <p style={{ fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.3rem' }}>아직 블록이 없어요</p>
            <p style={{ fontSize:'10px', color:'#aaa' }}>아래 버튼으로 블록을 추가해보세요</p>
          </div>
        )}

        {blocks.map((block, idx) => (
          <div key={block.id} style={{ border:'1px solid #E0DED8', background:'#FAFAF8' }}>
            {/* 블록 헤더 */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.5rem 0.75rem', borderBottom: editingId === block.id || block.type === 'image' || block.type === 'divider' ? '1px solid #E0DED8' : 'none', background:'#F5F4F0' }}>
              <span style={{ fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#C8B89A', flex:1 }}>
                {block.type === 'heading' ? 'H Heading' : block.type === 'text' ? '¶ Text' : block.type === 'image' ? '⬜ Image' : '— Divider'}
              </span>
              {/* 순서 버튼 */}
              <button onClick={() => moveBlock(block.id, 'up')}   disabled={idx === 0}               style={btnStyle(idx === 0)}>↑</button>
              <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length-1} style={btnStyle(idx === blocks.length-1)}>↓</button>
              {/* 편집 버튼 (텍스트/heading만) */}
              {(block.type === 'text' || block.type === 'heading') && editingId !== block.id && (
                <button onClick={() => { setEditingId(block.id); setEditContent(block.content); editingIdRef.current = block.id; editContentRef.current = block.content }} style={{ ...btnStyle(false), color:'#1A1A18' }}>✏</button>
              )}
              {/* 삭제 버튼 */}
              <button onClick={() => deleteBlock(block.id)} style={{ ...btnStyle(false), color:'#C0392B' }}>✕</button>
            </div>

            {/* 블록 내용 */}
            {block.type === 'divider' && (
              <div style={{ padding:'0.75rem 1rem' }}>
                <hr style={{ border:'none', borderTop:'1px solid #E0DED8' }} />
              </div>
            )}

            {block.type === 'image' && (
              <div style={{ position:'relative', aspectRatio:'16/9', background:'#ECEAE4', overflow:'hidden' }}>
                <img src={block.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}

            {(block.type === 'heading' || block.type === 'text') && (
              editingId === block.id ? (
                <div style={{ padding:'0.75rem' }}>
                  <textarea
                    autoFocus
                    value={editContent}
                    onChange={e => { setEditContent(e.target.value); editContentRef.current = e.target.value }}
                    placeholder={block.type === 'heading' ? '제목을 입력하세요' : '본문을 입력하세요...'}
                    style={{
                      width:'100%', minHeight: block.type === 'heading' ? '48px' : '100px',
                      padding:'0.6rem 0.8rem', border:'1px solid #C8B89A',
                      background:'#fff', fontFamily: block.type === 'heading' ? 'DM Serif Display, serif' : 'DM Mono, monospace',
                      fontSize: block.type === 'heading' ? '1.1rem' : '13px',
                      color:'#1A1A18', outline:'none', resize:'vertical', lineHeight:1.6,
                      boxSizing:'border-box',
                    }}
                  />
                  <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.5rem' }}>
                    <button
                      onClick={() => saveBlock(block.id, editContent)}
                      disabled={saving === block.id}
                      style={{ padding:'0.4rem 1rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity: saving === block.id ? 0.5 : 1 }}
                    >
                      {saving === block.id ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ padding:'0.4rem 0.8rem', background:'transparent', color:'#888880', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase', border:'1px solid #E0DED8', cursor:'pointer' }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => { setEditingId(block.id); setEditContent(block.content); editingIdRef.current = block.id; editContentRef.current = block.content }}
                  style={{ padding:'0.75rem 1rem', cursor:'text', minHeight:'2.5rem' }}
                >
                  {block.content
                    ? <span style={{ fontFamily: block.type === 'heading' ? 'DM Serif Display, serif' : 'DM Mono, monospace', fontSize: block.type === 'heading' ? '1rem' : '12px', color:'#1A1A18', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                        {block.content}
                      </span>
                    : <span style={{ fontSize:'11px', color:'#C8B89A', fontStyle:'italic' }}>
                        클릭하여 {block.type === 'heading' ? '제목' : '본문'} 입력...
                      </span>
                  }
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* 블록 추가 버튼들 */}
      <div style={{ borderTop:'1px solid #E0DED8', paddingTop:'1rem' }}>
        <p style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.6rem' }}>블록 추가</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
          {BLOCK_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              style={{ padding:'0.6rem 0.8rem', background:'transparent', color:'#888880', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.06em', border:'1px solid #E0DED8', cursor:'pointer', textAlign:'left', transition:'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#1A1A18'; (e.currentTarget as HTMLElement).style.color='#1A1A18' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#E0DED8'; (e.currentTarget as HTMLElement).style.color='#888880' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default BlockEditor

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? '#D0CEC8' : '#888880', fontSize: '12px',
    padding: '0.15rem 0.3rem', lineHeight: 1,
  }
}
