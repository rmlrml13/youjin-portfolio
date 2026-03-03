'use client'
// components/insight/InsightViewTracker.tsx
import { useEffect } from 'react'

export default function InsightViewTracker({ insightId }: { insightId: number }) {
  useEffect(() => {
    const key = `viewed_insight_${insightId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch(`/api/insights/${insightId}/view`, { method: 'POST' })
  }, [insightId])

  return null
}
