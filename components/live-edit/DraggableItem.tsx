'use client'
// components/live-edit/DraggableItem.tsx
// 브레이크포인트별 위치 저장 (lg / md / sm)
import { useState, useEffect, useRef, useCallback } from 'react'

type BP = 'lg' | 'md' | 'sm'

interface Props {
  posKey: string           // 기본 키 (lg)
  posKeyMd?: string        // md 키
  posKeySm?: string        // sm 키
  initialPos?:   string    // lg 위치 "x,y"
  initialPosMd?: string    // md 위치
  initialPosSm?: string    // sm 위치
  children: React.ReactNode
}

type Pos = { x: number; y: number } | null

function parsePos(s?: string): Pos {
  if (!s || !s.includes(',')) return null
  const [x, y] = s.split(',').map(Number)
  if (isNaN(x) || isNaN(y)) return null
  return { x, y }
}

function getBP(): BP {
  const w = window.innerWidth
  if (w >= 1024) return 'lg'
  if (w >= 768)  return 'md'
  return 'sm'
}

// 컨테이너 기준 % 계산
function toContainerPct(clientX: number, clientY: number, rect: DOMRect, offsetDx: number, offsetDy: number) {
  const cx = clientX - offsetDx
  const cy = clientY - offsetDy
  return {
    x: Math.round(Math.max(1, Math.min(99, ((cx - rect.left) / rect.width)  * 100)) * 10) / 10,
    y: Math.round(Math.max(1, Math.min(99, ((cy - rect.top)  / rect.height) * 100)) * 10) / 10,
  }
}

async function savePos(key: string, x: number, y: number) {
  const token = localStorage.getItem('youjin_token') ?? ''
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ [key]: `${x},${y}` }),
  })
  return res.ok
}

// 현재 브레이크포인트에 맞는 위치 — 없으면 상위 BP 폴백
function resolvePos(bp: BP, lg: Pos, md: Pos, sm: Pos): Pos {
  if (bp === 'sm') return sm ?? md ?? lg
  if (bp === 'md') return md ?? lg
  return lg
}

export default function DraggableItem({
  posKey, posKeyMd, posKeySm,
  initialPos, initialPosMd, initialPosSm,
  children,
}: Props) {
  const [editMode,   setEditMode]   = useState(false)
  const [bp,         setBp]         = useState<BP>('lg')
  const [isDragging, setIsDragging] = useState(false)
  const [saved,      setSaved]      = useState(false)

  // 브레이크포인트별 위치 state
  const [posLg, setPosLg] = useState<Pos>(() => parsePos(initialPos))
  const [posMd, setPosMd] = useState<Pos>(() => parsePos(initialPosMd))
  const [posSm, setPosSm] = useState<Pos>(() => parsePos(initialPosSm))

  const wrapRef    = useRef<HTMLDivElement>(null)
  const containerR = useRef<HTMLElement | null>(null)
  const dragging   = useRef(false)
  const curPos     = useRef<Pos>(null)
  const dragOffset = useRef({ dx: 0, dy: 0 })
  const bpRef      = useRef<BP>('lg')

  // initialPos 변경 시 동기화
  useEffect(() => { setPosLg(parsePos(initialPos)) },   [initialPos])
  useEffect(() => { setPosMd(parsePos(initialPosMd)) }, [initialPosMd])
  useEffect(() => { setPosSm(parsePos(initialPosSm)) }, [initialPosSm])

  // editMode 감지
  useEffect(() => {
    const sync = () => setEditMode(document.body.classList.contains('live-edit-mode'))
    const obs = new MutationObserver(sync)
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    sync()
    return () => obs.disconnect()
  }, [])

  // 브레이크포인트 감지
  useEffect(() => {
    const update = () => {
      const next = getBP()
      setBp(next)
      bpRef.current = next
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // 현재 BP의 키
  function currentKey(): string {
    if (bp === 'sm' && posKeySm) return posKeySm
    if (bp === 'md' && posKeyMd) return posKeyMd
    return posKey
  }

  // 현재 BP setter
  function setCurrentPos(p: Pos) {
    if (bp === 'sm') setPosSm(p)
    else if (bp === 'md') setPosMd(p)
    else setPosLg(p)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerR.current) return
    const rect = containerR.current.getBoundingClientRect()
    const newPos = toContainerPct(e.clientX, e.clientY, rect, dragOffset.current.dx, dragOffset.current.dy)
    curPos.current = newPos
    // 현재 BP state 업데이트 (bpRef 사용)
    const cur = bpRef.current
    if (cur === 'sm') setPosSm(newPos)
    else if (cur === 'md') setPosMd(newPos)
    else setPosLg(newPos)
  }, [])

  const onMouseUp = useCallback(async () => {
    if (!dragging.current) return
    dragging.current = false
    setIsDragging(false)
    const p = curPos.current
    if (!p) return
    const key = bpRef.current === 'sm' && posKeySm ? posKeySm
              : bpRef.current === 'md' && posKeyMd ? posKeyMd
              : posKey
    const ok = await savePos(key, p.x, p.y)
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 1500) }
  }, [posKey, posKeyMd, posKeySm])

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
    const container = wrapRef.current.closest('[data-hero-container]') as HTMLElement | null
    if (!container) return
    containerR.current = container

    e.preventDefault()
    e.stopPropagation()

    const cr = container.getBoundingClientRect()
    const ir = wrapRef.current.getBoundingClientRect()
    const centerX = ir.left + ir.width  / 2
    const centerY = ir.top  + ir.height / 2

    // 처음 드래그 시 현재 DOM 위치 기준으로 초기화
    const resolved = resolvePos(bp, posLg, posMd, posSm)
    if (!resolved) {
      const initX = Math.round(((centerX - cr.left) / cr.width)  * 100 * 10) / 10
      const initY = Math.round(((centerY - cr.top)  / cr.height) * 100 * 10) / 10
      const init = { x: initX, y: initY }
      curPos.current = init
      setCurrentPos(init)
    } else {
      curPos.current = resolved
    }

    dragOffset.current = {
      dx: e.clientX - centerX,
      dy: e.clientY - centerY,
    }
    dragging.current = true
    setIsDragging(true)
  }

  // 현재 화면에 표시할 위치
  const displayPos = resolvePos(bp, posLg, posMd, posSm)

  // 위치 미설정 + 비편집 → 원래 레이아웃
  if (!displayPos && !editMode) return <>{children}</>

  // 위치 미설정 + 편집 → 드래그 힌트
  if (!displayPos && editMode) {
    return (
      <div
        ref={wrapRef}
        style={{ display: 'inline-block', cursor: 'grab', outline: '1.5px dashed rgba(255,255,255,0.5)', outlineOffset: '6px' }}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>
    )
  }

  // 위치 설정됨 → 컨테이너 기준 absolute
  return (
    <div
      ref={wrapRef}
      style={{
        position:  'absolute',
        left:      `${displayPos!.x}%`,
        top:       `${displayPos!.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor:    editMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        zIndex:    isDragging ? 50 : 10,
        userSelect: editMode ? 'none' : 'auto',
        outline:   editMode ? '1.5px dashed rgba(255,255,255,0.5)' : 'none',
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
