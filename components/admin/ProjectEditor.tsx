'use client'
// components/admin/ProjectEditor.tsx
import { useState, useRef } from 'react'
import type { Project } from '@/lib/types'
import BlockEditor from '@/components/portfolio/BlockEditor'
import { s, fmtDate } from './adminStyles'

type EditTab = 'info' | 'blocks'

interface ProjectForm {
  title: string; tag: string; year: string
  client: string; description: string; sort_order: number
}

interface Props {
  selectedProject: Project | null
  isCreating: boolean
  token: string
  onSaved: (project: Project, isNew: boolean) => void
  onDeleted: (id: number, title: string) => void
}

function toForm(p: Project | null): ProjectForm {
  if (!p) return { title:'', tag:'', year:'', client:'', description:'', sort_order:0 }
  return { title:p.title, tag:p.tag, year:p.year, client:p.client??'', description:p.description??'', sort_order:p.sort_order }
}

export default function ProjectEditor({ selectedProject, isCreating, token, onSaved, onDeleted }: Props) {
  // key prop으로 리마운트되므로 초기값 한 번만 세팅
  const [editTab,      setEditTab]      = useState<EditTab>('info')
  const [form,         setForm]         = useState<ProjectForm>(() => toForm(selectedProject))
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(selectedProject?.image_url ?? '')
  const [saving,       setSaving]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showEmpty = !selectedProject && !isCreating

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.title || !form.tag || !form.year) { alert('제목, 태그, 연도는 필수입니다.'); return }
    setSaving(true)
    const fd = new FormData()
    fd.append('title',       form.title)
    fd.append('tag',         form.tag)
    fd.append('year',        form.year)
    fd.append('client',      form.client)
    fd.append('description', form.description)
    fd.append('sort_order',  String(form.sort_order))
    fd.append('col_size',    'col-6')
    if (imageFile) fd.append('image', imageFile)

    const isEdit = !!selectedProject
    const res = await fetch(
      isEdit ? `/api/projects/${selectedProject!.id}` : '/api/projects',
      { method: isEdit ? 'PUT' : 'POST', headers:{ Authorization:`Bearer ${token}` }, body: fd }
    )
    setSaving(false)
    if (res.ok) {
      const saved = await res.json()
      onSaved(saved, !isEdit)
      if (!isEdit) setEditTab('blocks')
    } else {
      const e = await res.json(); alert('오류: ' + e.error)
    }
  }

  return (
    <>
      {/* 에디터 헤더 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E0DED8', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <p style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.2rem' }}>
            {selectedProject ? `Project #${selectedProject.id}` : '새 프로젝트'}
          </p>
          <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.15rem', color:'#1A1A18', marginBottom: selectedProject ? '0.5rem' : 0 }}>
            {selectedProject ? (form.title || selectedProject.title || '—') : 'New Project'}
          </h2>
          {selectedProject && (
            <div style={{ display:'flex', gap:'1.2rem' }}>
              <span style={s.metaChip}><span style={s.metaChipLabel}>등록</span>{fmtDate(selectedProject.created_at)}</span>
              {selectedProject.updated_at && selectedProject.updated_at !== selectedProject.created_at && (
                <span style={s.metaChip}><span style={s.metaChipLabel}>수정</span>{fmtDate(selectedProject.updated_at)}</span>
              )}
              <span style={s.metaChip}><span style={s.metaChipLabel}>조회</span>{(selectedProject.view_count ?? 0).toLocaleString()}</span>
            </div>
          )}
        </div>
        {selectedProject && (
          <a href={`/portfolio/${selectedProject.id}`} target="_blank"
            style={{ fontSize:'10px', color:'#888880', textDecoration:'none', letterSpacing:'0.08em', textTransform:'uppercase', border:'1px solid #E0DED8', padding:'0.4rem 0.9rem' }}>
            미리보기 ↗
          </a>
        )}
      </div>

      {/* 탭 (수정 모드만) */}
      {selectedProject && (
        <div style={{ display:'flex', background:'#fff', borderBottom:'1px solid #E0DED8', padding:'0 2rem', flexShrink:0 }}>
          {(['info', 'blocks'] as EditTab[]).map(t => (
            <button key={t} onClick={() => setEditTab(t)}
              style={{ padding:'0.7rem 1.2rem', background:'none', border:'none', borderBottom: editTab===t ? '2px solid #1A1A18' : '2px solid transparent', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.08em', textTransform:'uppercase', color: editTab===t ? '#1A1A18' : '#888880', cursor:'pointer', marginBottom:'-1px' }}>
              {t === 'info' ? '기본 정보' : '콘텐츠 블록'}
            </button>
          ))}
        </div>
      )}

      {/* 에디터 본문 */}
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* 빈 상태 */}
        {showEmpty && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#C8B89A' }}>
            <p style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.3rem', marginBottom:'0.5rem', color:'#888880' }}>프로젝트를 선택하거나</p>
            <p style={{ fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>새로 만들기를 눌러주세요</p>
          </div>
        )}

        {/* 기본 정보 폼 */}
        {editTab === 'info' && !showEmpty && (
          <div style={{ maxWidth:900, padding:'2.5rem 2rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'2.5rem', alignItems:'start' }}>

              {/* 썸네일 */}
              <div>
                <p style={s.sectionLabel}>썸네일</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width:'100%', aspectRatio:'3/4', background:'#ECEAE4', overflow:'hidden', cursor:'pointer', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'1.8rem', color:'#C8B89A', marginBottom:'0.4rem' }}>↑</div>
                        <span style={{ fontSize:'10px', color:'#888880', letterSpacing:'0.08em', textTransform:'uppercase' }}>클릭하여 업로드</span>
                      </div>
                  }
                  {imagePreview && (
                    <div
                      style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                      <span style={{ color:'#fff', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>이미지 변경</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageChange} />
              </div>

              {/* 필드들 */}
              <div>
                <p style={s.sectionLabel}>기본 정보</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  {([
                    { label:'제목 *',  key:'title',      placeholder:'Project Title', span:2 },
                    { label:'태그 *',  key:'tag',        placeholder:'Branding',      span:1 },
                    { label:'정렬 순서', key:'sort_order', placeholder:'0',             span:1 },
                  ] as { label:string; key:keyof ProjectForm; placeholder:string; span:number }[]).map(f => (
                    <div key={f.key} style={{ gridColumn:`span ${f.span}` }}>
                      <label style={s.label}>{f.label}</label>
                      <input
                        style={s.input} placeholder={f.placeholder}
                        value={String(form[f.key])}
                        type={f.key === 'sort_order' ? 'number' : 'text'}
                        min={f.key === 'sort_order' ? 0 : undefined}
                        onChange={e => setForm(p => ({ ...p, [f.key]: f.key === 'sort_order' ? Number(e.target.value) : e.target.value }))}
                      />
                    </div>
                  ))}
                  <div style={{ gridColumn:'span 2' }}>
                    <label style={s.label}>프로젝트 소개</label>
                    <textarea
                      style={{ ...s.input, height:'100px', resize:'vertical' as const }}
                      placeholder="상세 페이지 상단에 표시될 소개글"
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display:'flex', gap:'0.5rem', marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid #E0DED8' }}>
                  <button
                    onClick={handleSave} disabled={saving}
                    style={{ padding:'0.75rem 2rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity:saving?0.6:1 }}
                  >
                    {saving ? '저장 중...' : (selectedProject ? '저장' : '추가 후 블록 편집 →')}
                  </button>
                  {selectedProject && (
                    <button
                      onClick={() => onDeleted(selectedProject.id, selectedProject.title)}
                      style={{ padding:'0.75rem 1.2rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid #C0392B', cursor:'pointer' }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 블록 에디터 */}
        {editTab === 'blocks' && selectedProject && (
          <div style={{ maxWidth:760, margin:'0 auto', padding:'2.5rem 2rem' }}>
            <BlockEditor projectId={selectedProject.id} token={token} />
          </div>
        )}
      </div>
    </>
  )
}
