'use client'
// components/common/PageHero.tsx
import HeroImageEdit from '@/components/live-edit/HeroImageEdit'
import DraggableItem from '@/components/live-edit/DraggableItem'

interface Props {
  label: string
  title: string
  desc: string
  configKey: string
  initialImageUrl: string
  posKey: string
  initialPos: string
}

export default function PageHero({ label, title, desc, configKey, initialImageUrl, posKey, initialPos }: Props) {
  return (
    <div className="page-hero" style={{ position: 'relative' }} data-hero-container>
      <HeroImageEdit configKey={configKey} initialUrl={initialImageUrl}>
        <DraggableItem posKey={posKey} initialPos={initialPos}>
          <div className="page-hero-inner" style={{ position: 'static' }}>
            <p className="page-hero-label">{label}</p>
            <h1 className="page-hero-title">{title}</h1>
            <p className="page-hero-desc">{desc}</p>
          </div>
        </DraggableItem>
      </HeroImageEdit>
    </div>
  )
}
