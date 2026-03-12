'use client'
// components/portfolio/BlockEditorLegacy.tsx
// 자연스러운 글쓰기 에디터
// - 텍스트 영역은 하나의 contenteditable div (단락 자동 분리)
// - 제목은 # 또는 헤딩 버튼으로 전환
// - 상단 툴바: 사진 / 동영상 / URL / 구분선 삽입 + B I U 등 서식
// - 이미지/동영상은 글 중간에 인라인 삽입
// - flush() 호출 시 전체 내용 서버에 저장

import {
  useState, useEffect, useImperativeHandle, useRef, forwardRef,
} from 'react'
import type { ProjectBlock } from '@/lib/types'
import { COLORS } from '@/components/admin/adminStyles'

export interface BlockEditorHandle { flush: () => Promise<void> }

interface Props {
  projectId: number
  token: string
  apiBase?: string
  onBlocksChange?: (blocks: ProjectBlock[]) => void
}

interface LocalBlock {
  id: number | null
  type: ProjectBlock['type']
  content: string
  image_url: string
  sort_order: number
  dirty?: boolean
}

/* ═══════════════════════════════════════════ */
const BlockEditorLegacy = forwardRef<BlockEditorHandle, Props>(function BlockEditorLegacy(
  { projectId, token, apiBase = '/api/projects', onBlocksChange }, ref
) {
  const [blocks,   setBlocks]   = useState<LocalBlock[]>([])
  const [loading,  setLoading]  = useState(true)
  const [flushing, setFlushing] = useState(false)

  const blocksRef     = useRef<LocalBlock[]>([])
  const editorRef     = useRef<HTMLDivElement>(null)
  const imgInputRef   = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const isFirstRender = useRef(true)
  const base = `${apiBase}/${projectId}/blocks`

  useEffect(() => { isFirstRender.current = true; loadBlocks() }, [projectId])
  useEffect(() => {
    blocksRef.current = blocks
    onBlocksChange?.(blocks.filter(b => b.id != null) as any)
  }, [blocks])

  async function loadBlocks() {
    setLoading(true)
    const res  = await fetch(base)
    const data = await res.json()
    const loaded: LocalBlock[] = Array.isArray(data)
      ? data.map((b: ProjectBlock) => ({ id: b.id, type: b.type, content: b.content, image_url: b.image_url, sort_order: b.sort_order, dirty: false }))
      : []
    setBlocks(loaded.length > 0 ? loaded : [])
    setLoading(false)
  }

  useEffect(() => {
    if (loading) return
    if (isFirstRender.current) { isFirstRender.current = false; renderBlocksToEditor(blocks) }
  }, [loading])

  function renderBlocksToEditor(bs: LocalBlock[]) {
    const el = editorRef.current; if (!el) return
    el.innerHTML = ''
    if (bs.length === 0) { const p = document.createElement('p'); p.className = 'be-p'; el.appendChild(p); return }
    bs.forEach(b => {
      if (b.type === 'heading') { const h = document.createElement('h2'); h.className = 'be-h2'; h.innerHTML = b.content; h.contentEditable = 'true'; el.appendChild(h) }
      else if (b.type === 'text') { const p = document.createElement('p'); p.className = 'be-p'; p.innerHTML = b.content || ''; p.contentEditable = 'true'; el.appendChild(p) }
      else if (b.type === 'divider') { el.appendChild(makeDividerEl()) }
      else if (b.type === 'image') { el.appendChild(makeImageEl(b.image_url, b.id)); const p = document.createElement('p'); p.className = 'be-p'; p.contentEditable = 'true'; el.appendChild(p) }
      else if (b.type === 'video') { el.appendChild(makeVideoEl(b.content, b.id)); const p = document.createElement('p'); p.className = 'be-p'; p.contentEditable = 'true'; el.appendChild(p) }
    })
  }

  function parseEditorToBlocks(): LocalBlock[] {
    const el = editorRef.current; if (!el) return []
    const result: LocalBlock[] = []; let order = 0
    el.childNodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return
      const tag = node.tagName.toLowerCase()
      if (tag === 'h2') { result.push({ id: null, type: 'heading', content: node.innerHTML, image_url: '', sort_order: order++, dirty: true }) }
      else if (tag === 'p') { const html = node.innerHTML.replace(/<br>/g, ''); if (!html.trim()) return; result.push({ id: null, type: 'text', content: node.innerHTML, image_url: '', sort_order: order++, dirty: true }) }
      else if (node.classList.contains('be-divider')) { result.push({ id: Number(node.dataset.blockId) || null, type: 'divider', content: '', image_url: '', sort_order: order++, dirty: false }) }
      else if (node.classList.contains('be-image-wrap')) { const img = node.querySelector('img'); if (img) result.push({ id: Number(node.dataset.blockId) || null, type: 'image', content: '', image_url: img.src, sort_order: order++, dirty: false }) }
      else if (node.classList.contains('be-video-wrap')) { result.push({ id: Number(node.dataset.blockId) || null, type: 'video', content: node.dataset.src ?? '', image_url: '', sort_order: order++, dirty: false }) }
    })
    return result
  }

  function makeDividerEl(blockId?: number | null): HTMLElement {
    const wrap = document.createElement('div'); wrap.className = 'be-divider'; wrap.contentEditable = 'false'
    if (blockId) wrap.dataset.blockId = String(blockId)
    wrap.innerHTML = `<hr style="border:none;border-top:1px solid ${COLORS.borderMid};margin:1.25rem 0" /><button class="be-del-btn" style="position:absolute;right:0;top:50%;transform:translateY(-50%);padding:2px 10px;background:${COLORS.redLight};color:${COLORS.red};border:1px solid ${COLORS.red};border-radius:2px;font-size:10px;cursor:pointer;display:none">삭제</button>`
    wrap.style.position = 'relative'
    wrap.addEventListener('mouseenter', () => { const b = wrap.querySelector<HTMLElement>('.be-del-btn'); if (b) b.style.display = 'block' })
    wrap.addEventListener('mouseleave', () => { const b = wrap.querySelector<HTMLElement>('.be-del-btn'); if (b) b.style.display = 'none' })
    wrap.querySelector('.be-del-btn')?.addEventListener('click', () => {
      const id = Number(wrap.dataset.blockId) || null
      if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      wrap.remove(); syncBlocksFromEditor()
    })
    return wrap
  }

  function makeImageEl(url: string, blockId?: number | null): HTMLElement {
    const wrap = document.createElement('div'); wrap.className = 'be-image-wrap'; wrap.contentEditable = 'false'
    if (blockId) wrap.dataset.blockId = String(blockId)
    wrap.style.cssText = 'position:relative;display:inline-block;width:100%;margin:1rem 0'
    wrap.innerHTML = `<img src="${url}" alt="" style="max-width:100%;display:block;border-radius:4px;border:1px solid ${COLORS.border}" /><button data-action="delete-img" style="position:absolute;top:8px;right:8px;padding:4px 10px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:2px;font-size:10px;cursor:pointer;display:none">✕ 삭제</button>`
    wrap.addEventListener('mouseenter', () => { const b = wrap.querySelector<HTMLElement>('[data-action="delete-img"]'); if (b) b.style.display = 'block' })
    wrap.addEventListener('mouseleave', () => { const b = wrap.querySelector<HTMLElement>('[data-action="delete-img"]'); if (b) b.style.display = 'none' })
    wrap.querySelector('[data-action="delete-img"]')?.addEventListener('click', () => {
      const id = Number(wrap.dataset.blockId) || null
      if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const next = wrap.nextSibling
      if (next instanceof HTMLElement && next.tagName === 'P' && !next.textContent?.trim()) next.remove()
      wrap.remove(); syncBlocksFromEditor()
    })
    return wrap
  }

  function makeVideoEl(src: string, blockId?: number | null): HTMLElement {
    const wrap = document.createElement('div'); wrap.className = 'be-video-wrap'; wrap.contentEditable = 'false'
    if (blockId) wrap.dataset.blockId = String(blockId)
    if (src) wrap.dataset.src = src
    const embedUrl = getEmbedUrl(src)
    const mediaHtml = src ? (embedUrl ? `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;display:block" allowfullscreen></iframe>` : `<video src="${src}" controls style="width:100%;height:100%;object-fit:contain;display:block"></video>`) : ''
    wrap.style.cssText = 'position:relative;margin:1rem 0'
    wrap.innerHTML = src
      ? `<div style="aspect-ratio:16/9;background:#000;border-radius:4px;overflow:hidden;border:1px solid ${COLORS.border}">${mediaHtml}</div><div style="position:absolute;top:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity .15s" class="be-vid-btns"><button data-action="delete-vid" style="padding:3px 8px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:2px;font-size:10px;cursor:pointer">✕ 삭제</button></div>`
      : `<div style="border:1px dashed ${COLORS.borderMid};border-radius:4px;padding:1.25rem;background:${COLORS.bg}"><p style="font-size:11px;color:${COLORS.inkFaint};font-family:DM Mono,monospace;margin-bottom:.5rem">YouTube 또는 Vimeo URL</p><div style="display:flex;gap:.4rem"><input placeholder="https://..." style="flex:1;padding:.5rem .8rem;border:1px solid ${COLORS.border};border-radius:3px;font-size:12px;outline:none" /><button data-action="confirm-url" style="padding:.5rem 1rem;background:${COLORS.ink};color:#fff;border:none;border-radius:3px;font-size:11px;cursor:pointer">확인</button></div></div>`
    wrap.addEventListener('mouseenter', () => { const b = wrap.querySelector<HTMLElement>('.be-vid-btns'); if (b) b.style.opacity = '1' })
    wrap.addEventListener('mouseleave', () => { const b = wrap.querySelector<HTMLElement>('.be-vid-btns'); if (b) b.style.opacity = '0' })
    wrap.querySelector('[data-action="delete-vid"]')?.addEventListener('click', () => {
      const id = Number(wrap.dataset.blockId) || null
      if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      wrap.remove(); syncBlocksFromEditor()
    })
    const confirmUrl = async () => {
      const input = wrap.querySelector<HTMLInputElement>('input'); const url = input?.value.trim(); if (!url) return
      const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: 'video', content: url, sort_order: 0 }) })
      if (res.ok) { const saved = await res.json(); wrap.dataset.blockId = String(saved.id) }
      wrap.dataset.src = url; wrap.replaceWith(makeVideoEl(url, Number(wrap.dataset.blockId) || null))
    }
    wrap.querySelector('[data-action="confirm-url"]')?.addEventListener('click', confirmUrl)
    return wrap
  }

  function syncBlocksFromEditor() { const parsed = parseEditorToBlocks(); setBlocks(parsed); blocksRef.current = parsed }

  useImperativeHandle(ref, () => ({
    async flush() {
      setFlushing(true)
      const currentBlocks = parseEditorToBlocks()
      await fetch(base, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const saved = await Promise.all(currentBlocks.map(async (b, i): Promise<LocalBlock> => {
        if (b.type === 'image' || b.type === 'video') {
          if (b.id != null) await fetch(`${base}/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sort_order: i }) })
          return { ...b, sort_order: i }
        }
        const stripped = b.content.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim()
        if (b.type === 'text' && !stripped) return { ...b, id: null, sort_order: i }
        const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: b.type, content: b.content, sort_order: i }) })
        if (res.ok) { const d = await res.json(); return { ...b, id: d.id, sort_order: i, dirty: false } }
        return { ...b, sort_order: i }
      }))
      blocksRef.current = saved; setBlocks(saved); setFlushing(false)
    }
  }))

  function exec(cmd: string, value?: string) { editorRef.current?.focus(); document.execCommand(cmd, false, value) }

  function insertNodeAtCursor(node: HTMLElement) {
    editorRef.current?.focus()
    const sel = window.getSelection(); if (!sel || !sel.rangeCount) { editorRef.current?.appendChild(node); return }
    const range = sel.getRangeAt(0); let anchor = range.startContainer as Node
    while (anchor.parentNode !== editorRef.current) { anchor = anchor.parentNode!; if (!anchor || anchor === document.body) { editorRef.current?.appendChild(node); return } }
    anchor.parentNode?.insertBefore(node, anchor.nextSibling)
    if (!node.nextSibling || !(node.nextSibling instanceof HTMLElement && node.nextSibling.tagName === 'P')) {
      const p = document.createElement('p'); p.className = 'be-p'; p.contentEditable = 'true'; node.parentNode?.insertBefore(p, node.nextSibling)
    }
    const nextP = node.nextSibling as HTMLElement
    if (nextP) { const r = document.createRange(); r.setStart(nextP, 0); r.collapse(true); sel.removeAllRanges(); sel.addRange(r) }
    syncBlocksFromEditor()
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const imgEl = makeImageEl(URL.createObjectURL(file)); insertNodeAtCursor(imgEl)
    const fd = new FormData(); fd.append('image', file); fd.append('sort_order', String(blocksRef.current.length))
    const res = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (res.ok) { const saved = await res.json(); imgEl.dataset.blockId = String(saved.id); const img = imgEl.querySelector('img'); if (img) img.src = saved.image_url; syncBlocksFromEditor() }
    e.target.value = ''
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const vidEl = makeVideoEl(URL.createObjectURL(file)); insertNodeAtCursor(vidEl)
    const fd = new FormData(); fd.append('image', file)
    const upRes = await fetch('/api/upload?folder=videos', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (upRes.ok) {
      const { url } = await upRes.json()
      const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: 'video', content: url, sort_order: blocksRef.current.length }) })
      if (res.ok) { const saved = await res.json(); vidEl.dataset.blockId = String(saved.id); vidEl.dataset.src = url }
    }
    e.target.value = ''
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const sel = window.getSelection(); if (!sel || !sel.rangeCount) return
    if (e.key === 'Enter' && !e.shiftKey) {
      const anchor = getBlockElement()
      if (anchor?.tagName === 'H2') {
        e.preventDefault(); const p = document.createElement('p'); p.className = 'be-p'; p.contentEditable = 'true'
        anchor.parentNode?.insertBefore(p, anchor.nextSibling)
        const r = document.createRange(); r.setStart(p, 0); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); p.focus(); syncBlocksFromEditor()
      }
    }
    if (e.key === ' ') {
      const anchor = getBlockElement()
      if (anchor?.tagName === 'P' && anchor.textContent === '#') {
        e.preventDefault(); const h = document.createElement('h2'); h.className = 'be-h2'; h.contentEditable = 'true'
        anchor.replaceWith(h); const r = document.createRange(); r.setStart(h, 0); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); h.focus(); syncBlocksFromEditor()
      }
    }
  }

  function getBlockElement(): HTMLElement | null {
    const sel = window.getSelection(); if (!sel || !sel.rangeCount) return null
    let node = sel.getRangeAt(0).startContainer as Node
    while (node && node.parentNode !== editorRef.current) node = node.parentNode!
    return (node instanceof HTMLElement) ? node : null
  }

  function toggleHeading() {
    const anchor = getBlockElement(); if (!anchor) return
    if (anchor.tagName === 'H2') { const p = document.createElement('p'); p.className = 'be-p'; p.contentEditable = 'true'; p.innerHTML = anchor.innerHTML; anchor.replaceWith(p); setCursorEnd(p) }
    else if (anchor.tagName === 'P') { const h = document.createElement('h2'); h.className = 'be-h2'; h.contentEditable = 'true'; h.innerHTML = anchor.innerHTML; anchor.replaceWith(h); setCursorEnd(h) }
    syncBlocksFromEditor()
  }

  function setCursorEnd(el: HTMLElement) {
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false)
    const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r); el.focus()
  }

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.gold, borderRadius: '50%', animation: 'be-spin 0.6s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* 삽입 툴바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0.35rem 0.6rem', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '4px 4px 0 0' }}>
        <InsertBtn onClick={() => imgInputRef.current?.click()} title="사진">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          사진
        </InsertBtn>
        <InsertBtn onClick={() => videoInputRef.current?.click()} title="동영상">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          동영상
        </InsertBtn>
        <InsertBtn onClick={() => { const v = makeVideoEl(''); insertNodeAtCursor(v); v.querySelector<HTMLInputElement>('input')?.focus() }} title="URL">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          URL
        </InsertBtn>
        <div style={{ width: 1, height: 16, background: COLORS.border, margin: '0 2px' }} />
        <InsertBtn onClick={() => { const d = makeDividerEl(); insertNodeAtCursor(d) }} title="구분선">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="2" y1="12" x2="22" y2="12"/></svg>
          구분선
        </InsertBtn>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {flushing && (
            <>
              <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', border: `1.5px solid ${COLORS.border}`, borderTopColor: COLORS.gold, animation: 'be-spin 0.6s linear infinite' }} />
              <span style={{ fontSize: '9px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace' }}>저장 중...</span>
            </>
          )}
        </div>
      </div>

      {/* 서식 툴바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap', padding: '0.28rem 0.6rem', background: '#fff', border: `1px solid ${COLORS.border}`, borderTop: 'none', userSelect: 'none' }}>
        <FmtBtn onClick={toggleHeading} title="제목 전환 (# + 스페이스 단축키)">
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '13px', fontWeight: 700 }}>H</span>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => exec('bold')}><b>B</b></FmtBtn>
        <FmtBtn onClick={() => exec('italic')}><i style={{ fontStyle: 'italic' }}>I</i></FmtBtn>
        <FmtBtn onClick={() => exec('underline')}><u>U</u></FmtBtn>
        <FmtBtn onClick={() => exec('strikeThrough')}><span style={{ textDecoration: 'line-through' }}>T</span></FmtBtn>
        <VSep />
        <FmtBtn onClick={() => exec('justifyLeft')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </FmtBtn>
        <FmtBtn onClick={() => exec('justifyCenter')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </FmtBtn>
        <FmtBtn onClick={() => exec('justifyRight')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => { const url = prompt('링크 URL:'); if (url) exec('createLink', url) }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => exec('removeFormat')}>
          <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace' }}>Tx</span>
        </FmtBtn>
      </div>

      {/* 편집 영역 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onInput={syncBlocksFromEditor}
        style={{
          background: '#fff',
          border: `1px solid ${COLORS.border}`,
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          minHeight: 480,
          padding: '2rem 2.5rem 4rem',
          outline: 'none',
          color: COLORS.ink,
          fontSize: '15px',
          lineHeight: 1.85,
          wordBreak: 'break-word',
        }}
      />

      <input ref={imgInputRef}   type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
      <style>{`
        .be-p  { margin:0; min-height:1.85em; font-size:15px; line-height:1.85; color:${COLORS.ink} }
        .be-h2 { margin:.6rem 0 .3rem; font-family:'DM Serif Display',serif; font-size:1.5rem; font-weight:700; line-height:1.3; color:${COLORS.ink}; border-bottom:2px solid ${COLORS.border}; padding-bottom:.2rem }
        [contenteditable]:focus { outline:none }
        @keyframes be-spin { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
})

export default BlockEditorLegacy

/* ── 소컴포넌트 ── */
function InsertBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '0.35rem 0.7rem', background: 'transparent', color: COLORS.inkMid, border: 'none', cursor: 'pointer', borderRadius: 4, fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.04em', transition: 'all 0.12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = COLORS.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  )
}
function FmtBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.28rem 0.48rem', minWidth: 26, background: 'transparent', color: COLORS.ink, border: '1px solid transparent', borderRadius: 3, cursor: 'pointer', fontSize: '13px', lineHeight: 1, transition: 'all 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = COLORS.hover; e.currentTarget.style.borderColor = COLORS.border }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
    >{children}</button>
  )
}
function VSep() { return <div style={{ width: 1, height: 16, background: COLORS.border, margin: '0 2px', flexShrink: 0 }} /> }

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}
