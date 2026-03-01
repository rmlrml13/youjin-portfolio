'use client'
// components/portfolio/PortfolioLiveEditor.tsx
import { useState, useEffect } from 'react'
import type { Project } from '@/lib/types'
import type { PortfolioGridHandle } from './PortfolioGrid'
import PortfolioEditPanel from './PortfolioEditPanel'

interface Props {
  gridRef: React.RefObject<PortfolioGridHandle>
}

export default function PortfolioLiveEditor({ gridRef }: Props) {
  const [editMode, setEditMode]             = useState(false)
  const [panelOpen, setPanelOpen]           = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [token, setToken]                   = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('youjin_token') ?? '')
    const observer = new MutationObserver(() => {
      setEditMode(document.body.classList.contains('live-edit-mode'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const { action, project } = (e as CustomEvent).detail
      if (action === 'edit') { setEditingProject(project); setPanelOpen(true) }
      if (action === 'add')  { setEditingProject(null);    setPanelOpen(true) }
    }
    window.addEventListener('project-edit', handler)
    return () => window.removeEventListener('project-edit', handler)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('edit-mode-change', { detail: { editMode } }))
  }, [editMode])

  if (!editMode && !panelOpen) return null

  return (
    <>
      {panelOpen && (
        <PortfolioEditPanel
          project={editingProject}
          token={token}
          onSaved={() => {
            setPanelOpen(false)
            gridRef.current?.reload()
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '✓ 프로젝트 저장 완료' } }))
          }}
          onDeleted={() => {
            setPanelOpen(false)
            gridRef.current?.reload()
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { msg: '✓ 프로젝트 삭제 완료' } }))
          }}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}
