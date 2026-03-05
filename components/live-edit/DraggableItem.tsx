'use client'
// components/live-edit/DraggableItem.tsx
import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  posKey: string
  initialPos?: string  // "x,y" (%)
  children: React.ReactNode
}

type Pos = { x: number; y: number } | null

function parsePos(s?: string): Pos {
  if (!s || !s.includes(',')) return null
  const [x, y] = s.split(',').map(Number)
  if (isNaN(x) || isNaN(y)) return null
  return { x, y }
}

async function savePos(posKey: string, x: number, y: number) {
  const token = localStorage.getItem('youjin_token') ?? ''
  console.log('[DraggableItem] saving', posKey, x, y)
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ [posKey]: `${x},${y}` }),
  })
  const json = await res.json()
  console.log('[DraggableItem] save result', res.status, JSON.stringify(json))
  return res.ok
}

export default function DraggableItem({ posKey, initialPos, children }: Props) {
  const [editMode,   setEditMode]   = useState(false)
  const [pos,        setPos]        = useState<Pos>(() => parsePos(initialPos))
  const [isDragging, setIsDragging] = useState(false)
  const [saved,      setSaved]      = useState(false)

  const wrapRef    = useRef<HTMLDivElement>(null)
  const containerR = useRef<HTMLElement | null>(null)
  const dragging   = useRef(false)
  const curPos     = useRef<Pos>(parsePos(initialPos))  // 드래그 중 최신 위치
  const dragOffset = useRef({ dx: 0, dy: 0 })

  // initialPos prop 변경 시 동기화 (router.refresh 후)
  useEffect(() => {
    const p = parsePos(initialPos)
    curPos.current = p
    setPos(p)
  }, [initialPos])

  // editMode 감지
  useEffect(() => {
    const sync = () => setEditMode(document.body.classList.contains('live-edit-mode'))
    const obs = new MutationObserver(sync)
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    sync()
    return () => obs.disconnect()
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerR.current) return
    const rect = containerR.current.getBoundingClientRect()
    const x = Math.round(Math.max(2, Math.min(98, ((e.clientX - rect.left - dragOffset.current.dx) / rect.width)  * 100)))
    const y = Math.round(Math.max(2, Math.min(98, ((e.clientY - rect.top  - dragOffset.current.dy) / rect.height) * 100)))
    curPos.current = { x, y }
    console.log("postion : ", curPos.current)
    setPos({ x, y })
  }, [])

  const onMouseUp = useCallback(async () => {
    if (!dragging.current) return
    dragging.current = false
    setIsDragging(false)

    const p = curPos.current
    if (!p) return

    const ok = await savePos(posKey, p.x, p.y)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }, [posKey])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  function onMouseDown(e: React.MouseEvent) {
    if (!editMode || !wrapRef.current) return

    // container 탐색
    const container = wrapRef.current.closest('[data-hero-container]') as HTMLElement | null
    if (!container) {
      console.warn('[DraggableItem] data-hero-container not found')
      return
    }
    containerR.current = container

    e.preventDefault()
    e.stopPropagation()

    const cr = container.getBoundingClientRect()
    const ir = wrapRef.current.getBoundingClientRect()

    // 처음 드래그 시 현재 DOM 위치로 초기화
    if (!curPos.current) {
      const initX = Math.round(((ir.left + ir.width  / 2 - cr.left) / cr.width)  * 100)
      const initY = Math.round(((ir.top  + ir.height / 2 - cr.top)  / cr.height) * 100)
      curPos.current = { x: initX, y: initY }
      setPos(curPos.current)
    }

    dragOffset.current = {
      dx: e.clientX - (ir.left + ir.width  / 2 - cr.left),
      dy: e.clientY - (ir.top  + ir.height / 2 - cr.top),
    }
    dragging.current = true
    setIsDragging(true)
  }

  // 위치 미설정 + 비편집 → 원래 레이아웃
  if (!pos && !editMode) return <>{children}</>

  // 위치 미설정 + 편집 → 드래그 가능한 inline 래퍼
  if (!pos && editMode) {
    return (
      <div
        ref={wrapRef}
        style={{ cursor: 'grab', outline: '1.5px dashed rgba(255,255,255,0.5)', outlineOffset: '6px', display: 'inline-block' }}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>
    )
  }

  // 위치 설정됨 → absolute 고정
  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        left: `${pos!.x}%`,
        top:  `${pos!.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor:     editMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        zIndex:     isDragging ? 50 : 10,
        userSelect: editMode ? 'none' : 'auto',
        outline:    editMode ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
        outlineOffset: '6px',
      }}
      onMouseDown={onMouseDown}
    >
      {children}
      {saved && (
        <div style={{
          position: 'absolute', bottom: '-26px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: '#fff',
          fontSize: '10px', letterSpacing: '0.08em', padding: '3px 10px',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          ✓ 저장됨
        </div>
      )}
    </div>
  )
}
