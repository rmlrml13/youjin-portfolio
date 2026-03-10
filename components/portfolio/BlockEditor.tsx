'use client'
// components/portfolio/BlockEditor.tsx
// 자연스러운 글쓰기 에디터
// - 텍스트 영역은 하나의 contenteditable div (단락 자동 분리)
// - 제목은 # 또는 헤딩 버튼으로 전환
// - 상단 툴바: 사진 / 동영상 / URL / 구분선 삽입 + B I U 등 서식
// - 이미지/동영상은 글 중간에 인라인 삽입
// - flush() 호출 시 전체 내용 서버에 저장

import {
  useState, useEffect, useImperativeHandle, useRef, forwardRef, useCallback,
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
const BlockEditor = forwardRef<BlockEditorHandle, Props>(function BlockEditor(
  { projectId, token, apiBase = '/api/projects', onBlocksChange }, ref
) {
  const [blocks,   setBlocks]   = useState<LocalBlock[]>([])
  const [loading,  setLoading]  = useState(true)
  const [flushing, setFlushing] = useState(false)

  const blocksRef      = useRef<LocalBlock[]>([])
  const editorRef      = useRef<HTMLDivElement>(null)
  const imgInputRef    = useRef<HTMLInputElement>(null)
  const videoInputRef  = useRef<HTMLInputElement>(null)
  const base = `${apiBase}/${projectId}/blocks`

  /* ── 로드 ── */
  useEffect(() => {
    isFirstRender.current = true  // 프로젝트 바뀌면 DOM 재렌더링
    loadBlocks()
  }, [projectId])
  useEffect(() => {
    blocksRef.current = blocks
    onBlocksChange?.(blocks.filter(b => b.id != null) as any)
  }, [blocks])

  async function loadBlocks() {
    setLoading(true)
    const res  = await fetch(base)
    const data = await res.json()
    const loaded: LocalBlock[] = Array.isArray(data)
      ? data.map((b: ProjectBlock) => ({
          id: b.id, type: b.type, content: b.content,
          image_url: b.image_url, sort_order: b.sort_order, dirty: false,
        }))
      : []
    setBlocks(loaded.length > 0 ? loaded : [])
    setLoading(false)
    // 에디터 내용 초기화는 useEffect에서
  }

  /* 블록 → 에디터 DOM 복원 (로드 시에만, 수동 편집 중에는 안 교체) */
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (loading) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      renderBlocksToEditor(blocks)
    }
  }, [loading])

  function renderBlocksToEditor(bs: LocalBlock[]) {
    const el = editorRef.current; if (!el) return
    el.innerHTML = ''
    if (bs.length === 0) {
      const p = document.createElement('p')
      p.className = 'be-p'
      el.appendChild(p)
      return
    }
    bs.forEach(b => {
      if (b.type === 'heading') {
        const h = document.createElement('h2')
        h.className = 'be-h2'
        h.innerHTML = b.content
        h.contentEditable = 'true'
        el.appendChild(h)
      } else if (b.type === 'text') {
        const p = document.createElement('p')
        p.className = 'be-p'
        p.innerHTML = b.content || ''
        p.contentEditable = 'true'
        el.appendChild(p)
      } else if (b.type === 'divider') {
        el.appendChild(makeDividerEl())
      } else if (b.type === 'image') {
        el.appendChild(makeImageEl(b.image_url, b.id))
        // 이미지 뒤 빈 p
        const p = document.createElement('p')
        p.className = 'be-p'
        p.contentEditable = 'true'
        el.appendChild(p)
      } else if (b.type === 'video') {
        el.appendChild(makeVideoEl(b.content, b.id))
        const p = document.createElement('p')
        p.className = 'be-p'
        p.contentEditable = 'true'
        el.appendChild(p)
      }
    })
  }

  /* ── DOM → blocks 파싱 ── */
  function parseEditorToBlocks(): LocalBlock[] {
    const el = editorRef.current; if (!el) return []
    const result: LocalBlock[] = []
    let order = 0
    el.childNodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return
      const tag = node.tagName.toLowerCase()
      if (tag === 'h2') {
        const existing = findBlockByEl(node)
        result.push({ id: existing?.id ?? null, type: 'heading', content: node.innerHTML, image_url: '', sort_order: order++, dirty: existing ? node.innerHTML !== existing.content : true })
      } else if (tag === 'p') {
        const html = node.innerHTML.replace(/<br>/g, '')
        if (!html.trim()) return // 완전 빈 p는 스킵 (단, 유일한 p면 포함)
        const existing = findBlockByEl(node)
        result.push({ id: existing?.id ?? null, type: 'text', content: node.innerHTML, image_url: '', sort_order: order++, dirty: true })
      } else if (node.classList.contains('be-divider')) {
        const id = Number(node.dataset.blockId) || null
        result.push({ id, type: 'divider', content: '', image_url: '', sort_order: order++, dirty: false })
      } else if (node.classList.contains('be-image-wrap')) {
        const id = Number(node.dataset.blockId) || null
        const img = node.querySelector('img')
        if (img) result.push({ id, type: 'image', content: '', image_url: img.src, sort_order: order++, dirty: false })
      } else if (node.classList.contains('be-video-wrap')) {
        const id = Number(node.dataset.blockId) || null
        const src = node.dataset.src ?? ''
        result.push({ id, type: 'video', content: src, image_url: '', sort_order: order++, dirty: false })
      }
    })
    return result
  }

  function findBlockByEl(_el: HTMLElement): LocalBlock | undefined { return undefined }

  /* ── DOM 헬퍼: 구분선 ── */
  function makeDividerEl(blockId?: number | null): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'be-divider'
    wrap.contentEditable = 'false'
    if (blockId) wrap.dataset.blockId = String(blockId)
    wrap.innerHTML = `<hr style="border:none;border-top:1px solid ${COLORS.borderMid};margin:1.25rem 0" /><button class="be-del-btn" data-action="delete-divider" style="position:absolute;right:0;top:50%;transform:translateY(-50%);padding:2px 10px;background:${COLORS.redLight};color:${COLORS.red};border:1px solid ${COLORS.red};border-radius:2px;font-size:10px;cursor:pointer;display:none">삭제</button>`
    wrap.style.position = 'relative'
    wrap.addEventListener('mouseenter', () => { const b = wrap.querySelector<HTMLElement>('.be-del-btn'); if (b) b.style.display = 'block' })
    wrap.addEventListener('mouseleave', () => { const b = wrap.querySelector<HTMLElement>('.be-del-btn'); if (b) b.style.display = 'none' })
    wrap.querySelector('.be-del-btn')?.addEventListener('click', () => {
      const id = Number(wrap.dataset.blockId) || null
      if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      wrap.remove()
      syncBlocksFromEditor()
    })
    return wrap
  }

  /* ── DOM 헬퍼: 이미지 ── */
  function makeImageEl(url: string, blockId?: number | null): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'be-image-wrap'
    wrap.contentEditable = 'false'
    if (blockId) wrap.dataset.blockId = String(blockId)
    wrap.style.cssText = 'position:relative;display:inline-block;width:100%;margin:1rem 0'
    wrap.innerHTML = `<img src="${url}" alt="" style="max-width:100%;display:block;border-radius:4px;border:1px solid ${COLORS.border}" /><button data-action="delete-img" style="position:absolute;top:8px;right:8px;padding:4px 10px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:2px;font-size:10px;cursor:pointer;display:none">✕ 삭제</button>`
    wrap.addEventListener('mouseenter', () => { const b = wrap.querySelector<HTMLElement>('[data-action="delete-img"]'); if (b) b.style.display = 'block' })
    wrap.addEventListener('mouseleave', () => { const b = wrap.querySelector<HTMLElement>('[data-action="delete-img"]'); if (b) b.style.display = 'none' })
    wrap.querySelector('[data-action="delete-img"]')?.addEventListener('click', () => {
      const id = Number(wrap.dataset.blockId) || null
      if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      // 뒤에 빈 p도 같이 제거
      const next = wrap.nextSibling
      if (next instanceof HTMLElement && next.tagName === 'P' && !next.textContent?.trim()) next.remove()
      wrap.remove()
      syncBlocksFromEditor()
    })
    return wrap
  }

  /* ── DOM 헬퍼: 동영상 ── */
  function makeVideoEl(src: string, blockId?: number | null): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'be-video-wrap'
    wrap.contentEditable = 'false'
    if (blockId) wrap.dataset.blockId = String(blockId)
    if (src) wrap.dataset.src = src

    const embedUrl = getEmbedUrl(src)
    const mediaHtml = src
      ? (embedUrl
          ? `<iframe src="${embedUrl}" style="width:100%;height:100%;border:none;display:block" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`
          : `<video src="${src}" controls style="width:100%;height:100%;object-fit:contain;display:block"></video>`)
      : ''

    wrap.style.cssText = 'position:relative;margin:1rem 0'
    wrap.innerHTML = src
      ? `<div style="aspect-ratio:16/9;background:#000;border-radius:4px;overflow:hidden;border:1px solid ${COLORS.border}">${mediaHtml}</div><div style="position:absolute;top:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity .15s" class="be-vid-btns"><button data-action="edit-url" style="padding:3px 8px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:2px;font-size:10px;cursor:pointer">✏ 변경</button><button data-action="delete-vid" style="padding:3px 8px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:2px;font-size:10px;cursor:pointer">✕ 삭제</button></div>`
      : `<div class="be-vid-input" style="border:1px dashed ${COLORS.borderMid};border-radius:4px;padding:1.25rem;background:${COLORS.bg}"><p style="font-size:11px;color:${COLORS.inkFaint};font-family:DM Mono,monospace;margin-bottom:.5rem">YouTube 또는 Vimeo URL 붙여넣기</p><div style="display:flex;gap:.4rem"><input placeholder="https://www.youtube.com/watch?v=..." style="flex:1;padding:.5rem .8rem;border:1px solid ${COLORS.border};border-radius:3px;font-size:12px;font-family:DM Mono,monospace;outline:none" /><button data-action="confirm-url" style="padding:.5rem 1rem;background:${COLORS.ink};color:#fff;border:none;border-radius:3px;font-size:11px;font-family:DM Mono,monospace;cursor:pointer">확인</button><button data-action="cancel-url" style="padding:.5rem .6rem;background:transparent;color:${COLORS.inkMid};border:1px solid ${COLORS.border};border-radius:3px;font-size:11px;cursor:pointer">✕</button></div></div>`

    // 이벤트
    wrap.addEventListener('mouseenter', () => { const b = wrap.querySelector<HTMLElement>('.be-vid-btns'); if (b) b.style.opacity = '1' })
    wrap.addEventListener('mouseleave', () => { const b = wrap.querySelector<HTMLElement>('.be-vid-btns'); if (b) b.style.opacity = '0' })

    const attachVidEvents = () => {
      wrap.querySelector('[data-action="edit-url"]')?.addEventListener('click', () => {
        // wrap을 input 모드로 교체
        const newEl = makeVideoEl('', Number(wrap.dataset.blockId) || null)
        wrap.replaceWith(newEl)
        attachVidEvents.call(newEl)
        newEl.querySelector('input')?.focus()
      })
      wrap.querySelector('[data-action="delete-vid"]')?.addEventListener('click', () => {
        const id = Number(wrap.dataset.blockId) || null
        if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        const next = wrap.nextSibling
        if (next instanceof HTMLElement && next.tagName === 'P' && !next.textContent?.trim()) next.remove()
        wrap.remove()
        syncBlocksFromEditor()
      })
      const confirmUrl = async () => {
        const input = wrap.querySelector<HTMLInputElement>('input')
        const url = input?.value.trim(); if (!url) return
        // 저장
        const id = Number(wrap.dataset.blockId) || null
        if (!id) {
          const res = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ type: 'video', content: url, sort_order: 0 }),
          })
          if (res.ok) { const saved = await res.json(); wrap.dataset.blockId = String(saved.id) }
        } else {
          await fetch(`${base}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content: url }),
          })
        }
        wrap.dataset.src = url
        const newEl = makeVideoEl(url, Number(wrap.dataset.blockId) || null)
        wrap.replaceWith(newEl)
      }
      wrap.querySelector('[data-action="confirm-url"]')?.addEventListener('click', confirmUrl)
      wrap.querySelector('[data-action="cancel-url"]')?.addEventListener('click', () => {
        const id = Number(wrap.dataset.blockId) || null
        if (id) fetch(`${base}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        const next = wrap.nextSibling
        if (next instanceof HTMLElement && next.tagName === 'P' && !next.textContent?.trim()) next.remove()
        wrap.remove()
        syncBlocksFromEditor()
      })
      wrap.querySelector<HTMLInputElement>('input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); confirmUrl() }
      })
    }
    attachVidEvents()
    return wrap
  }

  /* ── 에디터 → blocks 동기화 ── */
  function syncBlocksFromEditor() {
    const parsed = parseEditorToBlocks()
    setBlocks(parsed)
    blocksRef.current = parsed
  }

  /* ── flush ── */
  useImperativeHandle(ref, () => ({
    async flush() {
      setFlushing(true)

      // 1) DOM에서 현재 블록 파싱
      const currentBlocks = parseEditorToBlocks()

      // 2) DB에서 이 프로젝트의 텍스트/제목/구분선 전부 삭제 (단일 API 호출)
      await fetch(base, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      // 3) 현재 내용 일괄 INSERT + 미디어 sort_order PUT
      const saved = await Promise.all(currentBlocks.map(async (b, i): Promise<LocalBlock> => {
        // 이미지/동영상: sort_order만 업데이트
        if (b.type === 'image' || b.type === 'video') {
          if (b.id != null) {
            await fetch(`${base}/${b.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ sort_order: i }),
            })
          }
          return { ...b, sort_order: i }
        }
        // 빈 텍스트 스킵
        const stripped = b.content.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim()
        if (b.type === 'text' && !stripped) {
          return { ...b, id: null, sort_order: i }
        }
        // 텍스트/제목/구분선 새로 INSERT
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: b.type, content: b.content, sort_order: i }),
        })
        if (res.ok) {
          const d = await res.json()
          return { ...b, id: d.id, sort_order: i, dirty: false }
        }
        return { ...b, sort_order: i }
      }))

      blocksRef.current = saved
      setBlocks(saved)
      setFlushing(false)
    }
  }))

  /* ── execCommand ── */
  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }

  /* ── 커서 위치에 노드 삽입 ── */
  function insertNodeAtCursor(node: HTMLElement) {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) {
      // 포커스 없으면 맨 끝에
      editorRef.current?.appendChild(node)
      return
    }
    const range = sel.getRangeAt(0)
    // 삽입 위치의 블록 레벨 요소 찾기
    let anchor = range.startContainer as Node
    while (anchor.parentNode !== editorRef.current) {
      anchor = anchor.parentNode!
      if (!anchor || anchor === document.body) { editorRef.current?.appendChild(node); return }
    }
    anchor.parentNode?.insertBefore(node, anchor.nextSibling)
    // 노드 뒤에 빈 p 추가 (없으면)
    if (!node.nextSibling || !(node.nextSibling instanceof HTMLElement && node.nextSibling.tagName === 'P')) {
      const p = document.createElement('p')
      p.className = 'be-p'
      p.contentEditable = 'true'
      node.parentNode?.insertBefore(p, node.nextSibling)
    }
    // 빈 p에 포커스
    const nextP = node.nextSibling as HTMLElement
    if (nextP) {
      const r = document.createRange()
      r.setStart(nextP, 0); r.collapse(true)
      sel.removeAllRanges(); sel.addRange(r)
    }
    syncBlocksFromEditor()
  }

  /* ── 이미지 업로드 ── */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const localUrl = URL.createObjectURL(file)
    const imgEl = makeImageEl(localUrl)
    insertNodeAtCursor(imgEl)

    const fd = new FormData()
    fd.append('image', file)
    fd.append('sort_order', String(blocksRef.current.length))
    const res = await fetch(base, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (res.ok) {
      const saved = await res.json()
      imgEl.dataset.blockId = String(saved.id)
      const img = imgEl.querySelector('img')
      if (img) img.src = saved.image_url
      syncBlocksFromEditor()
    }
    e.target.value = ''
  }

  /* ── 동영상 업로드 ── */
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const localUrl = URL.createObjectURL(file)
    const vidEl = makeVideoEl(localUrl)
    insertNodeAtCursor(vidEl)

    const fd = new FormData()
    fd.append('image', file)
    const upRes = await fetch('/api/upload?folder=videos', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    if (upRes.ok) {
      const { url } = await upRes.json()
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'video', content: url, sort_order: blocksRef.current.length }),
      })
      if (res.ok) {
        const saved = await res.json()
        vidEl.dataset.blockId = String(saved.id)
        vidEl.dataset.src = url
      }
    }
    e.target.value = ''
  }

  /* ── 키다운: 제목 전환 ── */
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return

    // Enter: 기본 동작 허용하되, be-h2 끝에서 Enter → p로 전환
    if (e.key === 'Enter' && !e.shiftKey) {
      const anchor = getBlockElement()
      if (anchor?.tagName === 'H2') {
        e.preventDefault()
        const p = document.createElement('p')
        p.className = 'be-p'
        p.contentEditable = 'true'
        anchor.parentNode?.insertBefore(p, anchor.nextSibling)
        const r = document.createRange()
        r.setStart(p, 0); r.collapse(true)
        sel.removeAllRanges(); sel.addRange(r)
        p.focus()
        syncBlocksFromEditor()
        return
      }
    }

    // # 으로 시작하는 빈 p → h2로 전환
    if (e.key === ' ') {
      const anchor = getBlockElement()
      if (anchor?.tagName === 'P' && anchor.textContent === '#') {
        e.preventDefault()
        const h = document.createElement('h2')
        h.className = 'be-h2'
        h.contentEditable = 'true'
        anchor.replaceWith(h)
        const r = document.createRange()
        r.setStart(h, 0); r.collapse(true)
        sel.removeAllRanges(); sel.addRange(r)
        h.focus()
        syncBlocksFromEditor()
        return
      }
    }
  }

  function getBlockElement(): HTMLElement | null {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return null
    let node = sel.getRangeAt(0).startContainer as Node
    while (node && node.parentNode !== editorRef.current) {
      node = node.parentNode!
    }
    return (node instanceof HTMLElement) ? node : null
  }

  /* ── 제목 토글 버튼 ── */
  function toggleHeading() {
    const anchor = getBlockElement()
    if (!anchor) return
    if (anchor.tagName === 'H2') {
      const p = document.createElement('p')
      p.className = 'be-p'
      p.contentEditable = 'true'
      p.innerHTML = anchor.innerHTML
      anchor.replaceWith(p)
      setCursorEnd(p)
    } else if (anchor.tagName === 'P') {
      const h = document.createElement('h2')
      h.className = 'be-h2'
      h.contentEditable = 'true'
      h.innerHTML = anchor.innerHTML
      anchor.replaceWith(h)
      setCursorEnd(h)
    }
    syncBlocksFromEditor()
  }

  function setCursorEnd(el: HTMLElement) {
    const r = document.createRange()
    r.selectNodeContents(el); r.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges(); sel?.addRange(r)
    el.focus()
  }

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ══════ 상단 1행: 삽입 툴바 ══════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        padding: '0.35rem 0.6rem',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '4px 4px 0 0',
      }}>
        <InsertBtn onClick={() => imgInputRef.current?.click()} title="사진">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          사진
        </InsertBtn>
        <InsertBtn onClick={() => videoInputRef.current?.click()} title="동영상 파일">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          동영상
        </InsertBtn>
        <InsertBtn
          onClick={() => {
            const vidEl = makeVideoEl('')
            insertNodeAtCursor(vidEl)
            vidEl.querySelector<HTMLInputElement>('input')?.focus()
          }}
          title="YouTube / Vimeo URL"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          URL
        </InsertBtn>
        <div style={{ width: 1, height: 16, background: COLORS.border, margin: '0 2px' }} />
        <InsertBtn
          onClick={() => {
            const divEl = makeDividerEl()
            insertNodeAtCursor(divEl)
          }}
          title="구분선"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="2" y1="12" x2="22" y2="12"/></svg>
          구분선
        </InsertBtn>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {flushing && (
            <>
              <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', border: `1.5px solid ${COLORS.border}`, borderTopColor: COLORS.gold, animation: 'spin 0.6s linear infinite' }} />
              <span style={{ fontSize: '9px', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace' }}>저장 중...</span>
            </>
          )}
        </div>
      </div>

      {/* ══════ 상단 2행: 서식 툴바 ══════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap',
        padding: '0.28rem 0.6rem',
        background: '#fff',
        border: `1px solid ${COLORS.border}`,
        borderTop: 'none',
        userSelect: 'none',
      }}>
        {/* 제목 토글 */}
        <FmtBtn onClick={toggleHeading} title="제목 / 본문 전환">
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '13px', fontWeight: 700 }}>H</span>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => exec('bold')}          title="굵게"><b>B</b></FmtBtn>
        <FmtBtn onClick={() => exec('italic')}        title="기울임"><i style={{ fontStyle: 'italic' }}>I</i></FmtBtn>
        <FmtBtn onClick={() => exec('underline')}     title="밑줄"><u>U</u></FmtBtn>
        <FmtBtn onClick={() => exec('strikeThrough')} title="취소선"><span style={{ textDecoration: 'line-through' }}>T</span></FmtBtn>
        <VSep />
        <ColorPicker onSelect={color => exec('foreColor', color)} />
        <FontSizePicker onSelect={size => {
          const sel = window.getSelection()
          if (!sel || sel.isCollapsed) return
          document.execCommand('fontSize', false, '7')
          editorRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
            const span = document.createElement('span')
            span.style.fontSize = size
            span.innerHTML = (el as HTMLElement).innerHTML
            el.replaceWith(span)
          })
          syncBlocksFromEditor()
        }} />
        <VSep />
        <FmtBtn onClick={() => exec('justifyLeft')}   title="왼쪽">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </FmtBtn>
        <FmtBtn onClick={() => exec('justifyCenter')} title="가운데">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </FmtBtn>
        <FmtBtn onClick={() => exec('justifyRight')}  title="오른쪽">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => exec('insertUnorderedList')} title="글머리 기호">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
        </FmtBtn>
        <FmtBtn onClick={() => exec('insertOrderedList')} title="번호 목록">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => { const url = prompt('링크 URL:'); if (url) exec('createLink', url) }} title="링크">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </FmtBtn>
        <VSep />
        <FmtBtn onClick={() => exec('removeFormat')} title="서식 제거">
          <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace' }}>Tx</span>
        </FmtBtn>
      </div>

      {/* ══════ 본문 편집 영역 ══════ */}
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

      {/* 에디터 내부 스타일 */}
      <style>{`
        .be-p {
          margin: 0;
          min-height: 1.85em;
          font-size: 15px;
          line-height: 1.85;
          color: ${COLORS.ink};
        }
        .be-p:empty::before {
          content: attr(data-placeholder);
          color: #bbb;
          font-style: italic;
          pointer-events: none;
        }
        .be-h2 {
          margin: 0.6rem 0 0.3rem;
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          color: ${COLORS.ink};
          border-bottom: 2px solid ${COLORS.border};
          padding-bottom: 0.2rem;
        }
        .be-h2:focus {
          border-bottom-color: ${COLORS.gold};
        }
        .be-h2:empty::before {
          content: '제목을 입력하세요';
          color: #bbb;
          font-style: italic;
          pointer-events: none;
        }
        [contenteditable]:focus { outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
})

export default BlockEditor

/* ════════════════════════════════
   소컴포넌트
════════════════════════════════ */
function InsertBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        padding: '0.35rem 0.7rem',
        background: 'transparent', color: COLORS.inkMid,
        border: 'none', cursor: 'pointer', borderRadius: 4,
        fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.04em',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = COLORS.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  )
}

function FmtBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0.28rem 0.48rem', minWidth: 26,
        background: 'transparent', color: COLORS.ink,
        border: '1px solid transparent', borderRadius: 3,
        cursor: 'pointer', fontSize: '13px', lineHeight: 1, transition: 'all 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = COLORS.hover; e.currentTarget.style.borderColor = COLORS.border }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
    >{children}</button>
  )
}

function VSep() {
  return <div style={{ width: 1, height: 16, background: COLORS.border, margin: '0 2px', flexShrink: 0 }} />
}

function ColorPicker({ onSelect }: { onSelect: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  const colors = ['#1A1A18', '#555', '#888', '#C0392B', '#E67E22', '#F1C40F', '#27AE60', '#2980B9', '#8E44AD', '#fff']
  return (
    <div style={{ position: 'relative' }}>
      <FmtBtn onClick={() => setOpen(o => !o)} title="글자 색상">
        <span style={{ fontSize: '12px', fontWeight: 700 }}>A</span>
        <span style={{ width: 12, height: 3, background: '#C0392B', display: 'block', marginTop: 1 }} />
      </FmtBtn>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, zIndex: 200,
        }}>
          {colors.map(c => (
            <button key={c} onClick={() => { onSelect(c); setOpen(false) }}
              style={{ width: 20, height: 20, borderRadius: 3, background: c, border: `1px solid ${c === '#fff' ? COLORS.border : 'transparent'}`, cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function FontSizePicker({ onSelect }: { onSelect: (size: string) => void }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('14')
  const ref = useRef<HTMLDivElement>(null)
  const sizes = ['10','11','12','13','14','16','18','20','24','28','32','40']

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* 입력창 형태 버튼 */}
      <button
        onClick={() => setOpen(o => !o)}
        title="글자 크기"
        style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '0.22rem 0.4rem 0.22rem 0.6rem',
          background: '#fff',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 3, cursor: 'pointer',
          fontFamily: 'DM Mono, monospace', fontSize: '12px',
          color: COLORS.ink, minWidth: 46,
          transition: 'border-color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS.inkLight)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = open ? COLORS.inkLight : COLORS.border)}
      >
        <span style={{ flex: 1, textAlign: 'center', letterSpacing: 0 }}>{current}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 300,
          background: '#fff',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          padding: '0.25rem 0',
          minWidth: 56,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {sizes.map(s => (
            <button key={s}
              onClick={() => {
                setCurrent(s)
                onSelect(s + 'px')
                setOpen(false)
              }}
              style={{
                display: 'block', width: '100%',
                padding: '0.3rem 0.75rem',
                background: current === s ? COLORS.hover : 'transparent',
                border: 'none',
                fontFamily: 'DM Mono, monospace', fontSize: '12px',
                color: current === s ? COLORS.ink : COLORS.inkMid,
                fontWeight: current === s ? 700 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLORS.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = current === s ? COLORS.hover : 'transparent')}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* YouTube / Vimeo → embed URL */
export function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}
