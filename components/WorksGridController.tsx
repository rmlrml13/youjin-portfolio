'use client'
// components/WorksGridController.tsx
// WorksGrid와 LiveEditWrapper를 ref로 연결하는 클라이언트 브릿지

import { useRef } from 'react'
import WorksGrid, { type WorksGridHandle } from './WorksGrid'
import LiveProjectEditor from './LiveProjectEditor'

export default function WorksGridController() {
  const gridRef = useRef<WorksGridHandle>(null)

  return (
    <>
      <WorksGrid ref={gridRef} />
      <LiveProjectEditor gridRef={gridRef} />
    </>
  )
}
