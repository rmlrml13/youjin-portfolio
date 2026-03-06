// components/common/PageHero.tsx
import HeroImageEdit from '@/components/live-edit/HeroImageEdit'

interface Props {
  label: string
  title: string
  desc: string
  configKey: string
  initialImageUrl: string
  titleKey?: string   // config key for title (editable)
  descKey?: string    // config key for desc (editable)
  posKey?: string
  initialPos?: string
}

export default function PageHero({
  label, title, desc,
  configKey, initialImageUrl,
  titleKey, descKey,
}: Props) {
  return (
    <div className="page-hero" style={{ position: 'relative' }}>
      <HeroImageEdit configKey={configKey} initialUrl={initialImageUrl}>
        <div className="page-hero-inner">
          <p className="page-hero-label">{label}</p>
          <h1
            className={`page-hero-title${titleKey ? ' editable-field' : ''}`}
            {...(titleKey ? { 'data-edit': titleKey, 'data-label': 'Hero 타이틀', 'data-type': 'text' } : {})}
          >
            {title}
          </h1>
          <p
            className={`page-hero-desc${descKey ? ' editable-field' : ''}`}
            {...(descKey ? { 'data-edit': descKey, 'data-label': 'Hero 설명', 'data-type': 'textarea' } : {})}
          >
            {desc}
          </p>
        </div>
      </HeroImageEdit>
    </div>
  )
}
