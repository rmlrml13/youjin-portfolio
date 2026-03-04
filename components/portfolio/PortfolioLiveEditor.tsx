'use client'
// components/portfolio/PortfolioLiveEditor.tsx
import { useState, useEffect } from 'react'
import type { Project } from '@/lib/types'
import type { PortfolioGridHandle } from './PortfolioGrid'
import QuickEditPanel, { type QuickEditTarget } from '@/components/live-edit/QuickEditPanel'

interface Props {
  gridRef: React.RefObject<PortfolioGridHandle>
}

export default function PortfolioLiveEditor({ gridRef }: Props) {
  const [editMode,  setEditMode]  = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [target,    setTarget]    = useState<QuickEditTarget | null>(null)
  const [token,     setToken]     = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('youjin_token') ?? '')
    const observer = new MutationObserver(() => {
      setEditMode(document.body.classList.contains('live-edit-mode'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    setEditMode(document.body.classList.contains('live-edit-mode'))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const project = (e as CustomEvent<{ project: Project }>).detail.project
      setTarget({
        type:      'project',
        id:        project.id,
        title:     project.title,
        tag:       project.tag,
        thumbnail: project.image_url ?? '',
      })
      setPanelOpen(true)
    }
    window.addEventListener('project-edit', handler)
    return () => window.removeEventListener('project-edit', handler)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('edit-mode-change', { detail: { editMode } }))
  }, [editMode])

  return (
    <>
      {panelOpen && target && (
        <QuickEditPanel
          target={target}
          token={token}
          onSaved={() => {
            setPanelOpen(false)
            gridRef.current?.reload()
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '✓ 저장 완료' } }))
          }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}
