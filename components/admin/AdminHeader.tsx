'use client'
// components/admin/AdminHeader.tsx
type MainTab = 'projects' | 'insights' | 'contacts'

interface Props {
  mainTab: MainTab
  projectCount: number
  insightCount: number
  contactNewCount: number
  onTabChange: (tab: MainTab) => void
  onLogout: () => void
}

export default function AdminHeader({ mainTab, projectCount, insightCount, contactNewCount, onTabChange, onLogout }: Props) {
  const tabs: { key: MainTab; label: string; count: number }[] = [
    { key: 'projects', label: 'Portfolio', count: projectCount },
    { key: 'insights', label: 'Insight',   count: insightCount },
    { key: 'contacts', label: 'Contact',   count: contactNewCount },
  ]

  return (
    <header style={{ background:'#1A1A18', padding:'0 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', height:52, flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
        <span style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.1rem', fontStyle:'italic', color:'#fff' }}>
          Youjin CMS
        </span>

        <nav style={{ display:'flex' }}>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              style={{
                padding:'0 1.2rem', height:52,
                background:'none', border:'none',
                borderBottom: mainTab === key ? '2px solid #C8B89A' : '2px solid transparent',
                fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase',
                color: mainTab === key ? '#C8B89A' : 'rgba(255,255,255,0.45)',
                cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem',
                position: 'relative',
              }}
            >
              {label}
              {/* 신규 문의 뱃지 — contacts 탭에만 빨간 점 표시 */}
              {key === 'contacts' && count > 0 ? (
                <span style={{
                  background: '#C0392B', color: '#fff',
                  fontSize: '9px', padding: '1px 6px', borderRadius: 100,
                  fontWeight: 700, minWidth: 16, textAlign: 'center',
                }}>
                  {count}
                </span>
              ) : (
                <span style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontSize:'9px', padding:'1px 6px', borderRadius:100 }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
        <a href="/" target="_blank" style={{ color:'rgba(255,255,255,0.4)', textDecoration:'none', fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          사이트 ↗
        </a>
        <button
          onClick={onLogout}
          style={{ background:'none', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.35rem 0.8rem', cursor:'pointer' }}
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
