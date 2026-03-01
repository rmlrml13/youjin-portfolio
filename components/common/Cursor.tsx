'use client'
// components/Cursor.tsx
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    const move = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px'
      cursor.style.top  = e.clientY + 'px'
    }

    const expand = () => cursor.classList.add('expand')
    const shrink = () => cursor.classList.remove('expand')

    document.addEventListener('mousemove', move)

    const bindHover = () => {
      document.querySelectorAll('a, .work-item, button').forEach(el => {
        el.addEventListener('mouseenter', expand)
        el.addEventListener('mouseleave', shrink)
      })
    }

    bindHover()
    const observer = new MutationObserver(bindHover)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', move)
      observer.disconnect()
    }
  }, [])

  return <div className="cursor" ref={cursorRef} />
}
