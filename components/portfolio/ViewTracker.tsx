'use client'
// components/portfolio/ViewTracker.tsx
// 상세 페이지 마운트 시 조회수 +1 (한 세션에 한 번만)
import { useEffect } from 'react'

export default function ViewTracker({ projectId }: { projectId: number }) {
  useEffect(() => {
    const key = `viewed_${projectId}`
    if (sessionStorage.getItem(key)) return   // 같은 탭에서 이미 봤으면 스킵
    sessionStorage.setItem(key, '1')
    fetch(`/api/projects/${projectId}/view`, { method: 'POST' })
  }, [projectId])

  return null
}
