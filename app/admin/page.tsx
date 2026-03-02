'use client'
// app/admin/page.tsx
import { useState, useEffect, useRef } from 'react'
import type { Project, Insight } from '@/lib/types'
import BlockEditor from '@/components/portfolio/BlockEditor'

const EMPTY_PROJECT = { title:'', tag:'', year:'', client:'', description:'', sort_order:0 }
const EMPTY_INSIGHT = { category:'', title:'', description:'', date:'', read_time:'', sort_order:0 }

type MainTab = 'projects' | 'insights'
type EditTab = 'info' | 'blocks'

export default function AdminPage() {
  const [token,    setToken]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [toast,    setToast]    = useState('')
  const [mainTab,  setMainTab]  = useState<MainTab>('projects')

  /* ── Projects ── */
  const [projects,         setProjects]         = useState<Project[]>([])
  const [selectedProject,  setSelectedProject]  = useState<Project | null>(null)
  const [projectForm,      setProjectForm]      = useState(EMPTY_PROJECT)
  const [imageFile,        setImageFile]        = useState<File | null>(null)
  const [imagePreview,     setImagePreview]     = useState('')
  const [saving,           setSaving]           = useState(false)
  const [editTab,          setEditTab]          = useState<EditTab>('info')
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Insights ── */
  const [insights,        setInsights]        = useState<Insight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [insightForm,     setInsightForm]     = useState(EMPTY_INSIGHT)
  const [insightSaving,   setInsightSaving]   = useState(false)

  /* ── Auth ── */
  useEffect(() => {
    const saved = localStorage.getItem('youjin_token')
    if (!saved) return
    try {
      const payload = JSON.parse(atob(saved.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem('youjin_token'); return }
    } catch { localStorage.removeItem('youjin_token'); return }
    setToken(saved)
    fetchProjects()
    fetchInsights()
  }, [])

  async function doLogin() {
    setLoginErr('')
    const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) })
    const data = await res.json()
    if (!res.ok) { setLoginErr(data.error); return }
    localStorage.setItem('youjin_token', data.token)
    setToken(data.token)
    fetchProjects(); fetchInsights()
  }
  function doLogout() {
    localStorage.removeItem('youjin_token')
    setToken(''); setProjects([]); setInsights([])
    setSelectedProject(null); setSelectedInsight(null)
  }

  /* ── Projects CRUD ── */
  async function fetchProjects() {
    const data = await fetch('/api/projects').then(r => r.json()).catch(() => [])
    setProjects(Array.isArray(data) ? data : [])
  }

  function selectProject(p: Project) {
    setSelectedProject(p)
    setProjectForm({ title:p.title, tag:p.tag, year:p.year, client:p.client??'', description:p.description??'', sort_order:p.sort_order })
    setImageFile(null); setImagePreview(p.image_url || '')
    setEditTab('info')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function newProject() {
    setSelectedProject(null)
    setProjectForm(EMPTY_PROJECT)
    setImageFile(null); setImagePreview('')
    setEditTab('info')
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function saveProject() {
    if (!projectForm.title || !projectForm.tag || !projectForm.year) { alert('제목, 태그, 연도는 필수입니다.'); return }
    setSaving(true)
    const fd = new FormData()
    fd.append('title',       projectForm.title)
    fd.append('tag',         projectForm.tag)
    fd.append('year',        projectForm.year)
    fd.append('client',      projectForm.client)
    fd.append('description', projectForm.description)
    fd.append('sort_order',  String(projectForm.sort_order))
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
      showToast(isEdit ? '✓ 수정 완료' : '✓ 추가 완료')
      await fetchProjects()
      setSelectedProject(saved)
      // 새 프로젝트면 바로 블록 탭으로
      if (!isEdit) setEditTab('blocks')
    } else { const e = await res.json(); alert('오류: ' + e.error) }
  }

  async function deleteProject(id: number, title: string) {
    if (!confirm(`"${title}" 프로젝트를 삭제할까요?`)) return
    await fetch(`/api/projects/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    showToast('✓ 삭제 완료')
    setSelectedProject(null)
    fetchProjects()
  }

  /* ── Insights CRUD ── */
  async function fetchInsights() {
    const data = await fetch('/api/insights').then(r => r.json()).catch(() => [])
    setInsights(Array.isArray(data) ? data : [])
  }

  function selectInsight(ins: Insight) {
    setSelectedInsight(ins)
    setInsightForm({ category:ins.category, title:ins.title, description:ins.description, date:ins.date, read_time:ins.read_time, sort_order:ins.sort_order })
  }
  function newInsight() { setSelectedInsight(null); setInsightForm(EMPTY_INSIGHT) }

  async function saveInsight() {
    if (!insightForm.category || !insightForm.title || !insightForm.description || !insightForm.date) {
      alert('카테고리, 제목, 설명, 날짜는 필수입니다.'); return
    }
    setInsightSaving(true)
    const isEdit = !!selectedInsight
    const res = await fetch(
      isEdit ? `/api/insights/${selectedInsight!.id}` : '/api/insights',
      { method: isEdit ? 'PUT' : 'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(insightForm) }
    )
    setInsightSaving(false)
    if (res.ok) { showToast(isEdit ? '✓ 수정 완료' : '✓ 추가 완료'); newInsight(); fetchInsights() }
    else { const e = await res.json(); alert('오류: ' + e.error) }
  }

  async function deleteInsight(id: number, title: string) {
    if (!confirm(`"${title}" 항목을 삭제할까요?`)) return
    await fetch(`/api/insights/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    showToast('✓ 삭제 완료'); setSelectedInsight(null); fetchInsights()
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  /* ── 로그인 화면 ── */
  if (!token) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F4F0' }}>
      <div style={{ width:360, padding:'3rem', background:'#fff', border:'1px solid #E0DED8', display:'flex', flexDirection:'column' }}>
        <h1 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.8rem', marginBottom:'0.3rem' }}>Admin</h1>
        <p style={{ color:'#888880', fontSize:'11px', letterSpacing:'0.08em', marginBottom:'2rem' }}>Youjin Portfolio CMS</p>
        <label style={s.label}>아이디</label>
        <input style={s.input} value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} placeholder="admin" autoComplete="username"/>
        <label style={s.label}>비밀번호</label>
        <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} placeholder="••••••••" autoComplete="current-password"/>
        {loginErr && <p style={{ color:'#C0392B', fontSize:'11px', marginBottom:'0.75rem' }}>{loginErr}</p>}
        <button style={{ padding:'0.8rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase', border:'none', cursor:'pointer' }} onClick={doLogin}>로그인</button>
      </div>
    </div>
  )

  const isProjectSelected = mainTab === 'projects' && selectedProject
  const isNewProject      = mainTab === 'projects' && !selectedProject

  /* ── 어드민 본체 ── */
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#F5F4F0', overflow:'hidden' }}>

      {/* 상단 헤더 */}
      <header style={{ background:'#1A1A18', padding:'0 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', height:52, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
          <span style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.1rem', fontStyle:'italic', color:'#fff' }}>Youjin CMS</span>
          {/* 메인 탭 */}
          <nav style={{ display:'flex', gap:'0' }}>
            {(['projects','insights'] as MainTab[]).map(t => (
              <button key={t}
                onClick={() => { setMainTab(t); setSelectedProject(null); setSelectedInsight(null) }}
                style={{ padding:'0 1.2rem', height:52, background:'none', border:'none', borderBottom: mainTab===t ? '2px solid #C8B89A' : '2px solid transparent', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', color: mainTab===t ? '#C8B89A' : 'rgba(255,255,255,0.45)', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                {t === 'projects' ? 'Portfolio' : 'Insight'}
                <span style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontSize:'9px', padding:'1px 6px', borderRadius:100 }}>
                  {t === 'projects' ? projects.length : insights.length}
                </span>
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <a href="/" target="_blank" style={{ color:'rgba(255,255,255,0.4)', textDecoration:'none', fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>사이트 ↗</a>
          <button onClick={doLogout} style={{ background:'none', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.35rem 0.8rem', cursor:'pointer' }}>로그아웃</button>
        </div>
      </header>

      {/* 본문 — 좌: 목록, 우: 에디터 */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'280px 1fr', overflow:'hidden' }}>

        {/* ── 왼쪽 목록 ── */}
        <aside style={{ background:'#fff', borderRight:'1px solid #E0DED8', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #E0DED8', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:'10px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#888880' }}>
              {mainTab === 'projects' ? 'Projects' : 'Insights'}
            </span>
            <button
              onClick={mainTab === 'projects' ? newProject : newInsight}
              style={{ background:'#1A1A18', color:'#fff', border:'none', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase', padding:'0.4rem 0.8rem', cursor:'pointer' }}>
              + 새로 만들기
            </button>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {/* 프로젝트 목록 */}
            {mainTab === 'projects' && (
              projects.length === 0
                ? <p style={{ padding:'2rem', textAlign:'center', color:'#C8B89A', fontSize:'11px' }}>프로젝트가 없습니다</p>
                : projects.map(p => (
                    <div key={p.id} onClick={() => selectProject(p)}
                      style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.85rem 1.25rem', cursor:'pointer', borderBottom:'1px solid #F0EEE8', background: selectedProject?.id===p.id ? '#F5F4F0' : 'transparent', borderLeft: selectedProject?.id===p.id ? '3px solid #1A1A18' : '3px solid transparent', transition:'background 0.1s' }}>
                      <div style={{ width:40, height:40, flexShrink:0, background:'#ECEAE4', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {p.image_url
                          ? <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          : <span style={{ fontSize:'10px', color:'#C8B89A' }}>{p.sort_order+1}</span>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'#888880', marginBottom:'0.1rem' }}>{p.tag} · {p.year}</p>
                        <p style={{ fontSize:'13px', fontFamily:'DM Serif Display, serif', color:'#1A1A18', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</p>
                      </div>
                      <button onClick={e=>{e.stopPropagation();deleteProject(p.id,p.title)}}
                        style={{ background:'none', border:'none', color:'#D0CEC8', cursor:'pointer', fontSize:'11px', padding:'0.2rem', flexShrink:0 }}>✕</button>
                    </div>
                  ))
            )}

            {/* 인사이트 목록 */}
            {mainTab === 'insights' && (
              insights.length === 0
                ? <p style={{ padding:'2rem', textAlign:'center', color:'#C8B89A', fontSize:'11px' }}>글이 없습니다</p>
                : insights.map(ins => (
                    <div key={ins.id} onClick={() => selectInsight(ins)}
                      style={{ padding:'0.85rem 1.25rem', cursor:'pointer', borderBottom:'1px solid #F0EEE8', background: selectedInsight?.id===ins.id ? '#F5F4F0' : 'transparent', borderLeft: selectedInsight?.id===ins.id ? '3px solid #1A1A18' : '3px solid transparent' }}>
                      <p style={{ fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'#D0392B', marginBottom:'0.15rem' }}>{ins.category} · {ins.date}</p>
                      <p style={{ fontSize:'13px', fontFamily:'DM Serif Display, serif', color:'#1A1A18', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ins.title}</p>
                    </div>
                  ))
            )}
          </div>
        </aside>

        {/* ── 오른쪽 에디터 ── */}
        <main style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* ── PROJECTS 에디터 ── */}
          {mainTab === 'projects' && (
            <>
              {/* 에디터 헤더 */}
              <div style={{ background:'#fff', borderBottom:'1px solid #E0DED8', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                <div>
                  <p style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.2rem' }}>
                    {selectedProject ? `Project #${selectedProject.id}` : '새 프로젝트'}
                  </p>
                  <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.15rem', color:'#1A1A18' }}>
                    {selectedProject ? (projectForm.title || '—') : 'New Project'}
                  </h2>
                </div>
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                  {selectedProject && (
                    <a href={`/portfolio/${selectedProject.id}`} target="_blank"
                      style={{ fontSize:'10px', color:'#888880', textDecoration:'none', letterSpacing:'0.08em', textTransform:'uppercase', border:'1px solid #E0DED8', padding:'0.4rem 0.9rem' }}>
                      미리보기 ↗
                    </a>
                  )}
                </div>
              </div>

              {/* 탭 (수정 모드만) */}
              {selectedProject && (
                <div style={{ display:'flex', background:'#fff', borderBottom:'1px solid #E0DED8', padding:'0 2rem', flexShrink:0 }}>
                  {(['info','blocks'] as EditTab[]).map(t => (
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
                {!selectedProject && editTab === 'info' && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#C8B89A' }}>
                    <p style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.3rem', marginBottom:'0.5rem', color:'#888880' }}>프로젝트를 선택하거나</p>
                    <p style={{ fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>새로 만들기를 눌러주세요</p>
                  </div>
                )}

                {/* 기본 정보 폼 */}
                {editTab === 'info' && (isProjectSelected || isNewProject) && (
                  <div style={{ maxWidth:900, padding:'2.5rem 2rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'2.5rem', alignItems:'start' }}>

                      {/* 썸네일 */}
                      <div>
                        <p style={s.sectionLabel}>썸네일</p>
                        <div onClick={() => fileInputRef.current?.click()}
                          style={{ width:'100%', aspectRatio:'3/4', background:'#ECEAE4', overflow:'hidden', cursor:'pointer', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {imagePreview
                            ? <img src={imagePreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : <div style={{ textAlign:'center' }}>
                                <div style={{ fontSize:'1.8rem', color:'#C8B89A', marginBottom:'0.4rem' }}>↑</div>
                                <span style={{ fontSize:'10px', color:'#888880', letterSpacing:'0.08em', textTransform:'uppercase' }}>클릭하여 업로드</span>
                              </div>
                          }
                          {imagePreview && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
                              onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='0')}>
                              <span style={{ color:'#fff', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>이미지 변경</span>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageChange}/>
                      </div>

                      {/* 필드들 */}
                      <div>
                        <p style={s.sectionLabel}>기본 정보</p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                          {[
                            { label:'제목 *',     key:'title',       placeholder:'Project Title', span:2 },
                            { label:'태그 *',     key:'tag',         placeholder:'Branding',      span:1 },
                            { label:'연도 *',     key:'year',        placeholder:'2025',          span:1 },
                            { label:'클라이언트', key:'client',      placeholder:'Client Name',   span:2 },
                          ].map(f => (
                            <div key={f.key} style={{ gridColumn:`span ${f.span}` }}>
                              <label style={s.label}>{f.label}</label>
                              <input style={s.input} placeholder={f.placeholder}
                                value={(projectForm as any)[f.key]}
                                onChange={e=>setProjectForm(p=>({...p,[f.key]:e.target.value}))}/>
                            </div>
                          ))}
                          <div style={{ gridColumn:'span 2' }}>
                            <label style={s.label}>프로젝트 소개</label>
                            <textarea style={{ ...s.input, height:'100px', resize:'vertical' as const }}
                              placeholder="상세 페이지 상단에 표시될 소개글"
                              value={projectForm.description}
                              onChange={e=>setProjectForm(p=>({...p,description:e.target.value}))}/>
                          </div>
                          <div>
                            <label style={s.label}>정렬 순서</label>
                            <input style={s.input} type="number" min={0} value={projectForm.sort_order}
                              onChange={e=>setProjectForm(p=>({...p,sort_order:Number(e.target.value)}))}/>
                          </div>
                        </div>

                        <div style={{ display:'flex', gap:'0.5rem', marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid #E0DED8' }}>
                          <button onClick={saveProject} disabled={saving}
                            style={{ padding:'0.75rem 2rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity:saving?0.6:1 }}>
                            {saving ? '저장 중...' : (selectedProject ? '저장' : '추가 후 블록 편집 →')}
                          </button>
                          {selectedProject && (
                            <button onClick={() => deleteProject(selectedProject.id, selectedProject.title)}
                              style={{ padding:'0.75rem 1.2rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid #C0392B', cursor:'pointer' }}>
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
          )}

          {/* ── INSIGHTS 에디터 ── */}
          {mainTab === 'insights' && (
            <>
              <div style={{ background:'#fff', borderBottom:'1px solid #E0DED8', padding:'1rem 2rem', flexShrink:0 }}>
                <p style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.2rem' }}>
                  {selectedInsight ? `Insight #${selectedInsight.id}` : '새 글'}
                </p>
                <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.15rem', color:'#1A1A18' }}>
                  {selectedInsight ? (insightForm.title || '—') : 'New Insight'}
                </h2>
              </div>

              <div style={{ flex:1, overflowY:'auto', padding:'2.5rem 2rem' }}>
                {!selectedInsight && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, color:'#C8B89A' }}>
                    <p style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.3rem', marginBottom:'0.5rem', color:'#888880' }}>글을 선택하거나</p>
                    <p style={{ fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>새로 만들기를 눌러주세요</p>
                  </div>
                )}

                {(selectedInsight || mainTab === 'insights') && (
                  <div style={{ maxWidth:680 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                      {[
                        { label:'카테고리 *', key:'category',  placeholder:'Design Thinking', span:1 },
                        { label:'날짜 *',     key:'date',       placeholder:'2025.01',         span:1 },
                        { label:'제목 *',     key:'title',      placeholder:'글 제목',         span:2 },
                        { label:'읽기 시간',  key:'read_time',  placeholder:'5 min read',      span:1 },
                        { label:'정렬 순서',  key:'sort_order', placeholder:'0',               span:1 },
                      ].map(f => (
                        <div key={f.key} style={{ gridColumn:`span ${f.span}` }}>
                          <label style={s.label}>{f.label}</label>
                          <input style={s.input} placeholder={f.placeholder}
                            value={(insightForm as any)[f.key]}
                            onChange={e=>setInsightForm(p=>({...p,[f.key]:e.target.value}))}/>
                        </div>
                      ))}
                      <div style={{ gridColumn:'span 2' }}>
                        <label style={s.label}>설명 *</label>
                        <textarea style={{ ...s.input, height:'140px', resize:'vertical' as const }}
                          placeholder="카드에 표시되는 요약 설명"
                          value={insightForm.description}
                          onChange={e=>setInsightForm(p=>({...p,description:e.target.value}))}/>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid #E0DED8' }}>
                      <button onClick={saveInsight} disabled={insightSaving}
                        style={{ padding:'0.75rem 2rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity:insightSaving?0.6:1 }}>
                        {insightSaving ? '저장 중...' : (selectedInsight ? '저장' : '추가')}
                      </button>
                      {selectedInsight && (
                        <button onClick={() => deleteInsight(selectedInsight.id, selectedInsight.title)}
                          style={{ padding:'0.75rem 1.2rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid #C0392B', cursor:'pointer' }}>
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:'2rem', right:'2rem', background:'#1A1A18', color:'#fff', padding:'0.75rem 1.5rem', fontSize:'11px', letterSpacing:'0.08em', zIndex:999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  sectionLabel: { fontSize:'9px', letterSpacing:'0.16em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.75rem', display:'block' },
  label:  { display:'block', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#888880', marginBottom:'0.4rem' },
  input:  { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #E0DED8', background:'#fff', fontFamily:'DM Mono, monospace', fontSize:'13px', color:'#1A1A18', outline:'none', boxSizing:'border-box' as const },
}
