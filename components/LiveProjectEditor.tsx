'use client'
// components/LiveProjectEditor.tsx
// body.live-edit-mode일 때 WorksGrid에 편집 기능을 주입

import { useState, useEffect } from 'react'
import type { Project } from '@/lib/types'
import type { WorksGridHandle } from './WorksGrid'
import ProjectEditPanel from './ProjectEditPanel'

interface Props {
  gridRef: React.RefObject<WorksGridHandle>
}

export default function LiveProjectEditor({ gridRef }: Props) {
  const [editMode, setEditMode]           = useState(false)
  const [panelOpen, setPanelOpen]         = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null) // null = 새 프로젝트
  const [token, setToken]                 = useState('')

  // body 클래스 변화 감지 → editMode 동기화
  useEffect(() => {
    setToken(localStorage.getItem('yujin_token') ?? '')

    const observer = new MutationObserver(() => {
      setEditMode(document.body.classList.contains('live-edit-mode'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // 편집 모드 진입 시 WorksGrid에 props 전달 (커스텀 이벤트)
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, project } = (e as CustomEvent).detail
      if (action === 'edit')   { setEditingProject(project); setPanelOpen(true) }
      if (action === 'add')    { setEditingProject(null);    setPanelOpen(true) }
    }
    window.addEventListener('project-edit', handler)
    return () => window.removeEventListener('project-edit', handler)
  }, [])

  // WorksGrid에 editMode 알리기 — 커스텀 이벤트
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('edit-mode-change', { detail: { editMode } }))
  }, [editMode])

  if (!editMode && !panelOpen) return null

  return (
    <>
      {panelOpen && (
        <ProjectEditPanel
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
