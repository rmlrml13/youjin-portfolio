'use client'
// components/portfolio/BlockEditorCard.tsx
// 카드 블록 에디터
// - 블록마다 독립된 카드 UI
// - 상단 "+ 블록 추가" → 타입 선택 팝업
// - text/heading 블록 카드 헤더에 서식 툴바 (크기·굵기·색상·정렬)
// - 드래그 핸들로 순서 변경
// - flush() 호출 시 전체 저장

import {
  useState, useEffect, useRef, useImperativeHandle, forwardRef,
} from 'react'
import type { ProjectBlock } from '@/lib/types'
import { COLORS } from '@/components/admin/adminStyles'

export interface BlockEditorHandle { flush: () => Promise<void> }

type BType = ProjectBlock['type']

interface CBlock {
  localId:   string
  dbId:      number | null
  type:      BType
  content:   string
  image_url: string
  sort_order: number
}

interface Props {
  projectId:       number
  token:           string
  apiBase?:        string
  onBlocksChange?: (blocks: ProjectBlock[]) => void
}

let _lid = 0
const lid = () => `c${++_lid}`

function blank(type: BType, extra: Partial<CBlock> = {}): CBlock {
  return { localId: lid(), dbId: null, type, content: '', image_url: '', sort_order: 0, ...extra }
}

const TYPE_META: Record<BType, { icon: string; label: string; color: string }> = {
  text:    { icon: '¶',  label: '텍스트', color: '#555'     },
  heading: { icon: 'H',  label: '제목',   color: COLORS.gold },
  image:   { icon: '🖼', label: '이미지', color: '#2980B9'  },
  video:   { icon: '▶', label: '동영상', color: '#C0392B'  },
  divider: { icon: '—',  label: '구분선', color: '#aaa'     },
}

const FONT_SIZES = ['11', '12', '13', '14', '15', '16', '18', '20', '24', '28', '32', '40']
const COLORS_PALETTE = [
  { label: '기본',   value: COLORS.ink  },
  { label: '회색',   value: '#777'      },
  { label: '연회색', value: '#aaa'      },
  { label: '골드',   value: COLORS.gold },
  { label: '빨강',   value: '#C0392B'   },
  { label: '파랑',   value: '#2980B9'   },
  { label: '초록',   value: '#27AE60'   },
  { label: '흰색',   value: '#ffffff'   },
]

/* ═══════════════════════ MAIN ═══════════════════════ */
const BlockEditorCard = forwardRef<BlockEditorHandle, Props>(function BlockEditorCard(
  { projectId, token, apiBase = '/api/projects', onBlocksChange }, ref
) {
  const [blocks,   setBlocks]   = useState<CBlock[]>([])
  const [loading,  setLoading]  = useState(true)
  const [flushing, setFlushing] = useState(false)
  const [dragId,   setDragId]   = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const blocksRef    = useRef<CBlock[]>([])
  const globalImgRef = useRef<HTMLInputElement>(null)
  const pendingId    = useRef<string | null>(null)
  const base = `${apiBase}/${projectId}/blocks`

  /* ── 로드 ── */
  useEffect(() => { load() }, [projectId])
  useEffect(() => {
    blocksRef.current = blocks
    onBlocksChange?.(blocks.filter(b => b.dbId != null).map(b => ({
      id: b.dbId!, type: b.type, content: b.content,
      image_url: b.image_url, sort_order: b.sort_order,
    })))
  }, [blocks])

  async function load() {
    setLoading(true)
    const res  = await fetch(base)
    const data = await res.json()
    setBlocks(Array.isArray(data) && data.length > 0
      ? data.map((b: ProjectBlock): CBlock => ({
          localId: lid(), dbId: b.id, type: b.type,
          content: b.content, image_url: b.image_url, sort_order: b.sort_order,
        }))
      : []
    )
    setLoading(false)
  }

  /* ── flush ── */
  useImperativeHandle(ref, () => ({
    async flush() {
      setFlushing(true)
      const cur = blocksRef.current
      await fetch(base, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const saved = await Promise.all(cur.map(async (b, i): Promise<CBlock> => {
        if (b.type === 'image' || b.type === 'video') {
          if (b.dbId != null)
            await fetch(`${base}/${b.dbId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ sort_order: i }),
            })
          return { ...b, sort_order: i }
        }
        const text = b.content.replace(/<[^>]+>/g, '').trim()
        if (b.type === 'text' && !text) return { ...b, dbId: null, sort_order: i }
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: b.type, content: b.content, sort_order: i }),
        })
        if (res.ok) { const d = await res.json(); return { ...b, dbId: d.id, sort_order: i } }
        return { ...b, sort_order: i }
      }))
      blocksRef.current = saved; setBlocks(saved); setFlushing(false)
    }
  }))

  /* ── 헬퍼 ── */
  function upd(localId: string, patch: Partial<CBlock>) {
    setBlocks(bs => bs.map(b => b.localId === localId ? { ...b, ...patch } : b))
  }
  function del(localId: string, dbId: number | null) {
    if (dbId) fetch(`${base}/${dbId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setBlocks(bs => bs.filter(b => b.localId !== localId))
  }

  /* ── 블록 추가 ── */
  function addBlock(type: BType) {
    setAddOpen(false)
    if (type === 'image') {
      const nb = blank('image'); setBlocks(bs => [...bs, nb])
      pendingId.current = nb.localId
      setTimeout(() => globalImgRef.current?.click(), 50)
      return
    }
    if (type === 'divider') {
      const nb = blank('divider')
      fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'divider', content: '', sort_order: blocksRef.current.length }),
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (d) setBlocks(bs => bs.map(b => b.localId === nb.localId ? { ...b, dbId: d.id } : b))
      })
      setBlocks(bs => [...bs, nb])
      return
    }
    setBlocks(bs => [...bs, blank(type)])
  }

  /* ── 이미지 업로드 (전역) ── */
  async function handleGlobalImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const localId = pendingId.current; if (!localId) return
    upd(localId, { image_url: URL.createObjectURL(file) })
    const fd = new FormData(); fd.append('image', file); fd.append('sort_order', String(blocksRef.current.length))
    const res = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (res.ok) { const d = await res.json(); upd(localId, { dbId: d.id, image_url: d.image_url }) }
    e.target.value = ''; pendingId.current = null
  }

  /* ── 드래그 ── */
  function onDragStart(localId: string) { setDragId(localId) }
  function onDragOver(e: React.DragEvent, localId: string) { e.preventDefault(); setDragOver(localId) }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOver(null); return }
    setBlocks(bs => {
      const a = [...bs]
      const fi = a.findIndex(b => b.localId === dragId)
      const ti = a.findIndex(b => b.localId === targetId)
      const [item] = a.splice(fi, 1); a.splice(ti, 0, item); return a
    })
    setDragId(null); setDragOver(null)
  }

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.gold, borderRadius: '50%', animation: 'cbe-spin 0.6s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

      {/* ── 왼쪽: 블록 목록 ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {blocks.length === 0 ? (
          <div style={{
            border: `2px dashed ${COLORS.borderMid}`, borderRadius: 6,
            padding: '3rem 1.5rem', textAlign: 'center',
            background: COLORS.surface,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.6rem', opacity: 0.25 }}>☰</div>
            <p style={{ fontSize: '11px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>
              오른쪽에서 블록을 추가하세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {blocks.map(b => (
              <BlockCard
                key={b.localId}
                block={b}
                isDragging={dragId === b.localId}
                isDragOver={dragOver === b.localId}
                token={token}
                base={base}
                onUpdate={patch => upd(b.localId, patch)}
                onDelete={() => del(b.localId, b.dbId)}
                onDragStart={() => onDragStart(b.localId)}
                onDragOver={e => onDragOver(e, b.localId)}
                onDrop={() => onDrop(b.localId)}
                onDragEnd={() => { setDragId(null); setDragOver(null) }}
              />
            ))}
          </div>
        )}

        {/* 저장 인디케이터 */}
        {flushing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0', marginTop: '0.4rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', border: `1.5px solid ${COLORS.border}`, borderTopColor: COLORS.gold, animation: 'cbe-spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '9px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>저장 중...</span>
          </div>
        )}
      </div>

      {/* ── 오른쪽: 블록 추가 패널 (상시) ── */}
      <div style={{
        width: 88, flexShrink: 0,
        position: 'sticky', top: 0,
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {/* 섹션 레이블 */}
        <div style={{
          fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase',
          color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace',
          textAlign: 'center', paddingBottom: '6px',
          borderBottom: `1px solid ${COLORS.border}`,
          marginBottom: '2px',
        }}>추가</div>

        {(Object.entries(TYPE_META) as [BType, typeof TYPE_META[BType]][]).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            title={meta.label}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.3rem', padding: '0.6rem 0.4rem',
              background: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: 4, cursor: 'pointer', transition: 'all 0.12s',
              width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = COLORS.hover
              e.currentTarget.style.borderColor = meta.color
              e.currentTarget.style.borderLeftColor = meta.color
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.borderColor = COLORS.border
              e.currentTarget.style.borderLeftColor = meta.color
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1, color: meta.color }}>{meta.icon}</span>
            <span style={{
              fontSize: '8px', letterSpacing: '0.06em', textTransform: 'uppercase',
              color: COLORS.inkMid, fontFamily: 'DM Mono, monospace', lineHeight: 1.2,
              textAlign: 'center',
            }}>{meta.label}</span>
          </button>
        ))}
      </div>

      <input ref={globalImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleGlobalImg} />
      <style>{`@keyframes cbe-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

export default BlockEditorCard

/* ═══════════════════════ BlockCard ═══════════════════════ */
interface CardProps {
  block:       CBlock
  isDragging:  boolean
  isDragOver:  boolean
  token:       string
  base:        string
  onUpdate:    (patch: Partial<CBlock>) => void
  onDelete:    () => void
  onDragStart: () => void
  onDragOver:  (e: React.DragEvent) => void
  onDrop:      () => void
  onDragEnd:   () => void
}

function BlockCard({ block, isDragging, isDragOver, token, base, onUpdate, onDelete, onDragStart, onDragOver, onDrop, onDragEnd }: CardProps) {
  const [hover,    setHover]    = useState(false)
  const [urlInput, setUrlInput] = useState(block.content)
  const meta       = TYPE_META[block.type]
  const isText     = block.type === 'text' || block.type === 'heading'
  const editRef    = useRef<HTMLDivElement>(null)
  const imgFileRef = useRef<HTMLInputElement>(null)
  const vidFileRef = useRef<HTMLInputElement>(null)

  /* execCommand 래퍼 — contenteditable 에 포커스 유지 */
  function exec(cmd: string, value?: string) {
    editRef.current?.focus()
    document.execCommand(cmd, false, value ?? undefined)
    // 실행 후 HTML 동기화
    setTimeout(() => {
      if (editRef.current) onUpdate({ content: editRef.current.innerHTML })
    }, 0)
  }

  /* 글자 크기 적용 (font size 7 trick) */
  function applyFontSize(px: string) {
    editRef.current?.focus()
    document.execCommand('fontSize', false, '7')
    editRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
      const span = document.createElement('span')
      span.style.fontSize = px
      span.innerHTML = (el as HTMLElement).innerHTML
      el.replaceWith(span)
    })
    setTimeout(() => {
      if (editRef.current) onUpdate({ content: editRef.current.innerHTML })
    }, 0)
  }

  /* 이미지 교체 업로드 */
  async function handleImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    onUpdate({ image_url: URL.createObjectURL(file) })
    const fd = new FormData(); fd.append('image', file); fd.append('sort_order', '0')
    const res = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (res.ok) { const d = await res.json(); onUpdate({ dbId: d.id, image_url: d.image_url }) }
    e.target.value = ''
  }

  /* 동영상 파일 업로드 */
  async function handleVidChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    onUpdate({ content: URL.createObjectURL(file) })
    const fd = new FormData(); fd.append('image', file)
    const upRes = await fetch('/api/upload?folder=videos', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (upRes.ok) {
      const { url } = await upRes.json()
      const res = await fetch(base, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'video', content: url, sort_order: 0 }),
      })
      if (res.ok) { const d = await res.json(); onUpdate({ dbId: d.id, content: url }) }
    }
    e.target.value = ''
  }

  /* URL 동영상 확인 */
  async function confirmUrl() {
    if (!urlInput.trim()) return
    onUpdate({ content: urlInput })
    const res = await fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'video', content: urlInput, sort_order: 0 }),
    })
    if (res.ok) { const d = await res.json(); onUpdate({ dbId: d.id, content: urlInput }) }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        border: `1px solid ${isDragOver ? COLORS.gold : hover ? COLORS.borderMid : COLORS.border}`,
        borderLeft: `3px solid ${isDragOver ? COLORS.gold : meta.color}`,
        borderRadius: 4,
        background: isDragging ? COLORS.hover : '#fff',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.12s',
        overflow: 'hidden',
      }}
    >
      {/* ── 카드 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap',
        padding: '0.4rem 0.75rem',
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        userSelect: 'none',
        minHeight: 38,
      }}>
        {/* 드래그 핸들 */}
        <span
          title="드래그하여 순서 변경"
          style={{ cursor: 'grab', color: COLORS.inkFaint, fontSize: '14px', flexShrink: 0, lineHeight: 1, opacity: hover ? 1 : 0.3, transition: 'opacity 0.15s', marginRight: 2 }}
        >⠿</span>

        {/* 타입 뱃지 */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '2px 8px', borderRadius: 100,
          background: '#fff', border: `1px solid ${COLORS.border}`,
          fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: meta.color, fontFamily: 'DM Mono, monospace', fontWeight: 700,
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: block.type === 'heading' ? 'DM Serif Display, serif' : 'inherit' }}>{meta.icon}</span>
          {meta.label}
        </span>

        {/* ── 서식 툴바 (text/heading 전용) ── */}
        {isText && (
          <>
            <div style={{ width: 1, height: 16, background: COLORS.border, flexShrink: 0, margin: '0 2px' }} />

            {/* 굵기 */}
            <TBtn title="굵게 (선택 영역)" onClick={() => exec('bold')}><b style={{ fontWeight: 700 }}>B</b></TBtn>
            {/* 기울임 */}
            <TBtn title="기울임" onClick={() => exec('italic')}><i style={{ fontStyle: 'italic' }}>I</i></TBtn>
            {/* 밑줄 */}
            <TBtn title="밑줄" onClick={() => exec('underline')}><u>U</u></TBtn>

            <div style={{ width: 1, height: 16, background: COLORS.border, flexShrink: 0, margin: '0 2px' }} />

            {/* 글자 크기 */}
            <FontSizeDrop onSelect={applyFontSize} />

            {/* 글자 색상 */}
            <ColorDrop onSelect={color => exec('foreColor', color)} />

            <div style={{ width: 1, height: 16, background: COLORS.border, flexShrink: 0, margin: '0 2px' }} />

            {/* 정렬 */}
            <TBtn title="왼쪽 정렬" onClick={() => exec('justifyLeft')}>
              <AlignIcon d="M3 6h18M3 11h12M3 16h15" />
            </TBtn>
            <TBtn title="가운데 정렬" onClick={() => exec('justifyCenter')}>
              <AlignIcon d="M3 6h18M6 11h12M4 16h16" />
            </TBtn>
            <TBtn title="오른쪽 정렬" onClick={() => exec('justifyRight')}>
              <AlignIcon d="M3 6h18M9 11h12M6 16h15" />
            </TBtn>

            <div style={{ width: 1, height: 16, background: COLORS.border, flexShrink: 0, margin: '0 2px' }} />

            {/* 서식 초기화 */}
            <TBtn title="서식 초기화" onClick={() => exec('removeFormat')}>
              <span style={{ fontSize: '9px', fontFamily: 'DM Mono, monospace', letterSpacing: 0 }}>Tx</span>
            </TBtn>
          </>
        )}

        {/* 오른쪽: 삭제 버튼 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={onDelete}
            style={{
              padding: '2px 8px', background: 'transparent', border: `1px solid transparent`,
              color: COLORS.inkFaint, cursor: 'pointer', fontSize: '10px',
              fontFamily: 'DM Mono, monospace', borderRadius: 3, transition: 'all 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.redLight; e.currentTarget.style.color = COLORS.red; e.currentTarget.style.borderColor = COLORS.red }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.inkFaint; e.currentTarget.style.borderColor = 'transparent' }}
          >✕ 삭제</button>
        </div>
      </div>

      {/* ── 카드 본문 ── */}
      <div style={{ padding: '0.85rem 1rem' }}>

        {/* 텍스트 */}
        {block.type === 'text' && (
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onInput={e => onUpdate({ content: (e.target as HTMLDivElement).innerHTML })}
            dangerouslySetInnerHTML={{ __html: block.content }}
            data-placeholder="내용을 입력하세요..."
            style={{ outline: 'none', minHeight: '4rem', fontSize: '14px', lineHeight: 1.85, color: COLORS.ink, wordBreak: 'break-word' }}
          />
        )}

        {/* 제목 */}
        {block.type === 'heading' && (
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onInput={e => onUpdate({ content: (e.target as HTMLDivElement).innerHTML })}
            dangerouslySetInnerHTML={{ __html: block.content }}
            data-placeholder="제목을 입력하세요..."
            style={{ outline: 'none', minHeight: '2.5rem', fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.3, color: COLORS.ink, wordBreak: 'break-word' }}
          />
        )}

        {/* 이미지 */}
        {block.type === 'image' && (
          <>
            {block.image_url ? (
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={block.image_url} alt="" style={{ width: '100%', display: 'block', borderRadius: 3, border: `1px solid ${COLORS.border}` }} />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                  <ImgBtn onClick={() => imgFileRef.current?.click()}>변경</ImgBtn>
                </div>
              </div>
            ) : (
              <div
                onClick={() => imgFileRef.current?.click()}
                style={{ border: `2px dashed ${COLORS.borderMid}`, borderRadius: 4, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: COLORS.surface, transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS.inkLight)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = COLORS.borderMid)}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem', opacity: 0.5 }}>🖼</div>
                <p style={{ fontSize: '12px', color: COLORS.inkMid, fontFamily: 'DM Mono, monospace' }}>클릭하여 이미지 업로드</p>
                <p style={{ fontSize: '10px', color: COLORS.inkFaint, marginTop: '0.25rem', fontFamily: 'DM Mono, monospace' }}>JPG, PNG, GIF, WEBP</p>
              </div>
            )}
            <input ref={imgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgChange} />
          </>
        )}

        {/* 동영상 */}
        {block.type === 'video' && (
          <>
            {block.content ? (
              <div style={{ position: 'relative' }}>
                <VideoEmbed src={block.content} />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <ImgBtn onClick={() => { onUpdate({ content: '', dbId: null }); setUrlInput('') }}>변경</ImgBtn>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    placeholder="YouTube / Vimeo URL을 입력하세요..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmUrl()}
                    style={{ flex: 1, padding: '0.6rem 0.85rem', border: `1px solid ${COLORS.border}`, borderRadius: 3, fontSize: '12px', fontFamily: 'DM Mono, monospace', color: COLORS.ink, outline: 'none', background: COLORS.surface }}
                    onFocus={e => (e.target.style.borderColor = COLORS.gold)}
                    onBlur={e => (e.target.style.borderColor = COLORS.border)}
                  />
                  <button onClick={confirmUrl} style={{ padding: '0.6rem 1.1rem', background: COLORS.ink, color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>확인</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                  <span style={{ fontSize: '9px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>또는</span>
                  <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                </div>
                <button
                  onClick={() => vidFileRef.current?.click()}
                  style={{ padding: '0.6rem', border: `1px dashed ${COLORS.borderMid}`, background: COLORS.surface, borderRadius: 3, cursor: 'pointer', fontSize: '11px', color: COLORS.inkMid, fontFamily: 'DM Mono, monospace', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.inkLight; e.currentTarget.style.color = COLORS.ink }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.borderMid; e.currentTarget.style.color = COLORS.inkMid }}
                >📁 동영상 파일 업로드</button>
              </div>
            )}
            <input ref={vidFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVidChange} />
          </>
        )}

        {/* 구분선 */}
        {block.type === 'divider' && (
          <div style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: `2px solid ${COLORS.border}` }} />
            <span style={{ fontSize: '9px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>구분선</span>
            <hr style={{ flex: 1, border: 'none', borderTop: `2px solid ${COLORS.border}` }} />
          </div>
        )}
      </div>

      <style>{`
        [data-placeholder]:empty::before { content: attr(data-placeholder); color: #bbb; font-style: italic; pointer-events: none; }
        [contenteditable]:focus { outline: none !important; }
      `}</style>
    </div>
  )
}

/* ═══════════════════════ 서식 툴바 소컴포넌트 ═══════════════════════ */

/* 기본 툴바 버튼 */
function TBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}   // preventDefault → contenteditable 포커스 유지
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0.22rem 0.42rem', minWidth: 24, height: 24,
        background: 'transparent', color: COLORS.ink,
        border: '1px solid transparent', borderRadius: 3,
        cursor: 'pointer', fontSize: '12px', lineHeight: 1,
        transition: 'all 0.1s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = COLORS.hover; e.currentTarget.style.borderColor = COLORS.border }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
    >{children}</button>
  )
}

/* 글자 크기 드롭다운 */
function FontSizeDrop({ onSelect }: { onSelect: (px: string) => void }) {
  const [open, setOpen]       = useState(false)
  const [cur,  setCur]        = useState('14')
  const ref                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        title="글자 크기"
        style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '0 6px', height: 24, minWidth: 48,
          background: '#fff', border: `1px solid ${COLORS.border}`,
          borderRadius: 3, cursor: 'pointer',
          fontFamily: 'DM Mono, monospace', fontSize: '11px', color: COLORS.ink,
          transition: 'border-color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS.inkLight)}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = COLORS.border }}
      >
        <span style={{ flex: 1, textAlign: 'center' }}>{cur}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 2.5L4 5.5L7 2.5" stroke={COLORS.inkLight} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 400,
          background: '#fff', border: `1px solid ${COLORS.border}`,
          borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          padding: '0.2rem 0', minWidth: 56, maxHeight: 200, overflowY: 'auto',
        }}>
          {FONT_SIZES.map(s => (
            <button key={s}
              onMouseDown={e => { e.preventDefault(); setCur(s); onSelect(s + 'px'); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '0.28rem 0.7rem',
                background: cur === s ? COLORS.hover : 'transparent',
                border: 'none', fontFamily: 'DM Mono, monospace', fontSize: '11px',
                color: cur === s ? COLORS.ink : COLORS.inkMid,
                fontWeight: cur === s ? 700 : 400,
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLORS.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = cur === s ? COLORS.hover : 'transparent')}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* 글자 색상 드롭다운 */
function ColorDrop({ onSelect }: { onSelect: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  const [cur,  setCur]  = useState(COLORS.ink)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        title="글자 색상"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          gap: 2, padding: '3px 6px', height: 24,
          background: 'transparent', border: '1px solid transparent',
          borderRadius: 3, cursor: 'pointer', transition: 'all 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = COLORS.hover; e.currentTarget.style.borderColor = COLORS.border }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: cur, lineHeight: 1 }}>A</span>
        <span style={{ width: 14, height: 2.5, background: cur, borderRadius: 1, display: 'block' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 400,
          background: '#fff', border: `1px solid ${COLORS.border}`,
          borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          padding: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, minWidth: 140,
        }}>
          {COLORS_PALETTE.map(c => (
            <button key={c.value}
              onMouseDown={e => { e.preventDefault(); setCur(c.value); onSelect(c.value); setOpen(false) }}
              title={c.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '5px 4px', background: cur === c.value ? COLORS.hover : 'transparent',
                border: `1px solid ${cur === c.value ? COLORS.borderMid : 'transparent'}`,
                borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLORS.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = cur === c.value ? COLORS.hover : 'transparent')}
            >
              <span style={{ width: 20, height: 20, borderRadius: 3, background: c.value, border: c.value === '#ffffff' ? `1px solid ${COLORS.border}` : 'none', display: 'block' }} />
              <span style={{ fontSize: '8px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace', textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* 정렬 아이콘 SVG */
function AlignIcon({ d }: { d: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={`M${seg}`} />
      ))}
    </svg>
  )
}

/* ── 동영상 임베드 ── */
function VideoEmbed({ src }: { src: string }) {
  function getEmbed(url: string) {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
    const vm = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`
    return null
  }
  const embed = getEmbed(src)
  return (
    <div style={{ aspectRatio: '16/9', borderRadius: 4, overflow: 'hidden', background: '#000', border: `1px solid ${COLORS.border}` }}>
      {embed
        ? <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
        : <video src={src} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      }
    </div>
  )
}

/* ── 미디어 위 버튼 ── */
function ImgBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 3, fontSize: '10px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
      {children}
    </button>
  )
}
