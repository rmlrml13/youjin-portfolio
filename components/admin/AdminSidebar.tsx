'use client'
// components/admin/AdminSidebar.tsx
import type { Project, Insight } from '@/lib/types'
import { fmtDate } from './adminStyles'

type MainTab = 'projects' | 'insights'

interface Props {
  mainTab: MainTab
  projects: Project[]
  insights: Insight[]
  selectedProject: Project | null
  selectedInsight: Insight | null
  onSelectProject: (p: Project) => void
  onSelectInsight: (ins: Insight) => void
  onDeleteProject: (id: number, title: string) => void
  onNew: () => void
}

export default function AdminSidebar({
  mainTab, projects, insights,
  selectedProject, selectedInsight,
  onSelectProject, onSelectInsight, onDeleteProject, onNew,
}: Props) {
  return (
    <aside style={{ background:'#fff', borderRight:'1px solid #E0DED8', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* 사이드바 헤더 */}
      <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #E0DED8', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:'10px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#888880' }}>
          {mainTab === 'projects' ? 'Projects' : 'Insights'}
        </span>
        <button
          onClick={onNew}
          style={{ background:'#1A1A18', color:'#fff', border:'none', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.4rem 0.8rem', cursor:'pointer' }}
        >
          + 새로 만들기
        </button>
      </div>

      {/* 목록 */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {mainTab === 'projects' && (
          projects.length === 0
            ? <p style={{ padding:'2rem', textAlign:'center', color:'#C8B89A', fontSize:'11px' }}>프로젝트가 없습니다</p>
            : projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  style={{
                    display:'flex', alignItems:'center', gap:'0.75rem',
                    padding:'0.85rem 1.25rem', cursor:'pointer',
                    borderBottom:'1px solid #F0EEE8',
                    background: selectedProject?.id === p.id ? '#F5F4F0' : 'transparent',
                    borderLeft: selectedProject?.id === p.id ? '3px solid #1A1A18' : '3px solid transparent',
                    transition:'background 0.1s',
                  }}
                >
                  {/* 썸네일 */}
                  <div style={{ width:40, height:40, flexShrink:0, background:'#ECEAE4', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontSize:'10px', color:'#C8B89A' }}>{p.sort_order + 1}</span>
                    }
                  </div>

                  {/* 텍스트 */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'#888880', marginBottom:'0.1rem' }}>
                      {p.tag} · {p.year}
                    </p>
                    <p style={{ fontSize:'13px', fontFamily:'DM Serif Display, serif', color:'#1A1A18', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {p.title}
                    </p>
                    <p style={{ fontSize:'9px', color:'#C8B89A', marginTop:'0.15rem', fontFamily:'DM Mono, monospace' }}>
                      👁 {(p.view_count ?? 0).toLocaleString()} · {fmtDate(p.created_at)}
                    </p>
                  </div>

                  {/* 삭제 */}
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteProject(p.id, p.title) }}
                    style={{ background:'none', border:'none', color:'#D0CEC8', cursor:'pointer', fontSize:'11px', padding:'0.2rem', flexShrink:0 }}
                  >
                    ✕
                  </button>
                </div>
              ))
        )}

        {mainTab === 'insights' && (
          insights.length === 0
            ? <p style={{ padding:'2rem', textAlign:'center', color:'#C8B89A', fontSize:'11px' }}>글이 없습니다</p>
            : insights.map(ins => (
                <div
                  key={ins.id}
                  onClick={() => onSelectInsight(ins)}
                  style={{
                    padding:'0.85rem 1.25rem', cursor:'pointer',
                    borderBottom:'1px solid #F0EEE8',
                    background: selectedInsight?.id === ins.id ? '#F5F4F0' : 'transparent',
                    borderLeft: selectedInsight?.id === ins.id ? '3px solid #1A1A18' : '3px solid transparent',
                  }}
                >
                  <p style={{ fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'#D0392B', marginBottom:'0.15rem' }}>
                    {ins.category} · {ins.date}
                  </p>
                  <p style={{ fontSize:'13px', fontFamily:'DM Serif Display, serif', color:'#1A1A18', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {ins.title}
                  </p>
                </div>
              ))
        )}
      </div>
    </aside>
  )
}
