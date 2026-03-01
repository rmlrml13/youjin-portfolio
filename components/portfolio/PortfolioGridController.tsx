'use client'
// components/portfolio/PortfolioGridController.tsx
import { useRef } from 'react'
import PortfolioGrid, { type PortfolioGridHandle } from './PortfolioGrid'
import PortfolioLiveEditor from './PortfolioLiveEditor'

export default function PortfolioGridController() {
  const gridRef = useRef<PortfolioGridHandle>(null)
  return (
    <>
      <PortfolioGrid ref={gridRef} />
      <PortfolioLiveEditor gridRef={gridRef} />
    </>
  )
}
