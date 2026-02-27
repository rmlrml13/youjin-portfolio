'use client'
// app/admin/page.tsx
import { useState, useEffect, useRef } from 'react'
import type { Project } from '@/lib/types'

const ROMAN = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']
const COL_OPTIONS = ['col-4','col-5','col-6','col-7','col-8']
const COL_LABELS: Record<string, string> = {
  'col-4': '좁게 (col-4)', 'col-5': '보통 (col-5)', 'col-6': '중간 (col-6)',
  'col-7': '넓게 (col-7)', 'col-8': '아주 넓게 (col-8)'
}
const EMPTY_FORM = { title: '', tag: '', year: '', image_url: '', col_size: 'col-6', sort_order: 0 }

export default function AdminPage() {
  const [token, setToken]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [toast, setToast]       = useState('')

  const [projects, setProjects]         = useState<Project[]>([])
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [editId, setEditId]             = useState<number | null>(null)
  const [saving, setSaving]             = useState(false)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('yujin_token')
    if (saved) { setToken(saved); fetchProjects() }
  }, [])

  async function doLogin() {
    setLoginErr('')
    const res  = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) { setLoginErr(data.error); return }
    localStorage.setItem('yujin_token', data.token)
    setToken(data.token)
    fetchProjects()
  }

  function doLogout() {
    localStorage.removeItem('yujin_token')
    setToken(''); setProjects([])
  }

  async function fetchProjects() {
    const res  = await fetch('/api/projects')
    const data = await res.json()
    setProjects(Array.isArray(data) ? data : [])
  }

  function selectProject(p: Project) {
    setEditId(p.id)
    setForm({ title: p.title, tag: p.tag, year: p.year, image_url: p.image_url, col_size: p.col_size, sort_order: p.sort_order })
    setImageFile(null); setImagePreview(p.image_url || '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetForm() {
    setEditId(null); setForm(EMPTY_FORM)
    setImageFile(null); setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function saveProject() {
    if (!form.title || !form.tag || !form.year) { alert('제목, 태그, 연도는 필수입니다.'); return }
    setSaving(true)
    const fd = new FormData()
    fd.append('title', form.title); fd.append('tag', form.tag)
    fd.append('year', form.year);   fd.append('col_size', form.col_size)
    fd.append('sort_order', String(form.sort_order))
    if (imageFile) fd.append('image', imageFile)

    const res = await fetch(editId ? `/api/projects/${editId}` : '/api/projects', {
      method: editId ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    })
    setSaving(false)
    if (res.ok) { showToast(editId ? '✓ 수정 완료' : '✓ 추가 완료'); resetForm(); fetchProjects() }
    else { const e = await res.json(); alert('오류: ' + e.error) }
  }

  async function deleteProject(id: number, title: string) {
    if (!confirm(`"${title}" 프로젝트를 삭제할까요?`)) return
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) { showToast('✓ 삭제 완료'); resetForm(); fetchProjects() }
  }

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  // ── Login ──
  if (!token) return (
    <div style={s.loginWrap}>
      <div style={s.loginBox}>
        <h1 style={s.loginTitle}>Admin</h1>
        <p style={s.loginSub}>Yujin Portfolio CMS</p>
        <label style={s.label}>아이디</label>
        <input style={s.input} value={username} onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLogin()} placeholder="admin" autoComplete="username" />
        <label style={s.label}>비밀번호</label>
        <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLogin()} placeholder="••••••••" autoComplete="current-password" />
        {loginErr && <p style={s.errMsg}>{loginErr}</p>}
        <button style={s.btnPrimary} onClick={doLogin}>로그인</button>
      </div>
    </div>
  )

  // ── Admin ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={s.adminHeader}>
        <span style={s.adminLogo}>Yujin CMS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <a href="/" target="_blank" style={s.adminHeaderLink}>포트폴리오</a>
          <a href="/?edit=1" target="_blank" style={s.liveEditBtn}>
            ✏️ 라이브 편집
          </a>
          <button style={s.logoutBtn} onClick={doLogout}>로그아웃</button>
        </div>
      </div>

      <div style={s.adminBody}>
        {/* Left: Form */}
        <div style={s.formPanel}>
          <h2 style={s.panelTitle}>{editId ? '프로젝트 수정' : '프로젝트 추가'}</h2>
          <p style={s.panelSub}>{editId ? `#${editId} 수정 중` : '새 프로젝트를 등록합니다'}</p>

          <div style={{ ...s.imgPreview, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
            {imagePreview
              ? <img src={imagePreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.4rem', color:'var(--accent)' }}>↑</div>
                  <span style={{ fontSize:'11px', color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>클릭하여 이미지 업로드</span>
                </div>
            }
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageChange} />
          {imageFile && <p style={{ fontSize:'10px', color:'var(--muted)', marginBottom:'0.8rem' }}>📎 {imageFile.name}</p>}

          {[
            { label: '제목 *', key: 'title', placeholder: 'Project Title' },
            { label: '태그 *', key: 'tag',   placeholder: 'Branding · Identity' },
            { label: '연도 *', key: 'year',  placeholder: '2025' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '1rem' }}>
              <label style={s.label}>{f.label}</label>
              <input style={s.input} placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          <div style={{ marginBottom:'1rem' }}>
            <label style={s.label}>카드 크기</label>
            <select style={s.input} value={form.col_size} onChange={e => setForm(p => ({ ...p, col_size: e.target.value }))}>
              {COL_OPTIONS.map(c => <option key={c} value={c}>{COL_LABELS[c]}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={s.label}>정렬 순서</label>
            <input style={s.input} type="number" min={0} placeholder="0 (낮을수록 앞에)"
              value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
          </div>

          <div style={s.formActions}>
            <button style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={saveProject} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <button style={s.btnSecondary} onClick={resetForm}>초기화</button>
          </div>


        </div>

        {/* Right: List */}
        <div style={s.listPanel}>
          <div style={s.listHeader}>
            <h2 style={s.panelTitle}>등록된 프로젝트</h2>
            <span style={{ fontSize:'11px', color:'var(--muted)' }}>{projects.length} 개</span>
          </div>
          <div style={s.projectGrid}>
            {projects.length === 0 && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'4rem', color:'var(--muted)', fontSize:'11px' }}>등록된 프로젝트가 없습니다</div>
            )}
            {projects.map((p, i) => (
              <div key={p.id} style={{ ...s.card, ...(editId === p.id ? s.cardSelected : {}) }} onClick={() => selectProject(p)}>
                <div style={s.cardThumb}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontFamily:'DM Serif Display, serif', fontSize:'2rem', color:'var(--accent)' }}>{ROMAN[i] || i+1}</span>
                  }
                </div>
                <div style={s.cardInfo}>
                  <p style={s.cardTag}>{p.tag}</p>
                  <h3 style={s.cardTitle}>{p.title}</h3>
                  <div style={{ display:'flex', gap:'0.4rem' }}>
                    <button style={s.btnSm} onClick={e => { e.stopPropagation(); selectProject(p) }}>수정</button>
                    <button style={{ ...s.btnSm, ...s.btnDanger }} onClick={e => { e.stopPropagation(); deleteProject(p.id, p.title) }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  loginWrap:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' },
  loginBox:        { width:360, padding:'3rem', border:'1px solid var(--border)', background:'#fff', display:'flex', flexDirection:'column' },
  loginTitle:      { fontFamily:'DM Serif Display, serif', fontSize:'1.8rem', marginBottom:'0.4rem' },
  loginSub:        { color:'var(--muted)', fontSize:'11px', letterSpacing:'0.08em', marginBottom:'2.5rem' },
  label:           { display:'block', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--muted)', marginBottom:'0.5rem' },
  input:           { width:'100%', padding:'0.75rem 1rem', border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'DM Mono, monospace', fontSize:'13px', color:'var(--fg)', outline:'none', marginBottom:'1rem', display:'block' },
  errMsg:          { color:'#C0392B', fontSize:'11px', marginBottom:'0.8rem' },
  btnPrimary:      { padding:'0.75rem 1.5rem', background:'var(--fg)', color:'var(--bg)', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase' as const, border:'none', cursor:'pointer', width:'100%' },
  btnSecondary:    { padding:'0.75rem 1.5rem', background:'transparent', color:'var(--fg)', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase' as const, border:'1px solid var(--border)', cursor:'pointer', flex:1 },
  btnSm:           { padding:'0.4rem 0.8rem', background:'transparent', color:'var(--fg)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, border:'1px solid var(--border)', cursor:'pointer' },
  btnDanger:       { color:'#C0392B', borderColor:'#C0392B' },
  adminHeader:     { position:'sticky' as const, top:0, zIndex:100, background:'var(--fg)', color:'var(--bg)', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  adminLogo:       { fontFamily:'DM Serif Display, serif', fontSize:'1.1rem', color:'var(--bg)' },
  adminHeaderLink: { color:'rgba(255,255,255,0.6)', textDecoration:'none', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' as const },
  logoutBtn:       { background:'none', border:'1px solid rgba(255,255,255,0.3)', color:'rgba(255,255,255,0.8)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, padding:'0.4rem 1rem', cursor:'pointer' },
  adminBody:       { display:'grid', gridTemplateColumns:'340px 1fr', minHeight:'calc(100vh - 56px)' },
  formPanel:       { background:'#fff', borderRight:'1px solid var(--border)', padding:'2rem', overflowY:'auto' as const, display:'flex', flexDirection:'column' as const },
  panelTitle:      { fontFamily:'DM Serif Display, serif', fontSize:'1.2rem', marginBottom:'0.3rem' },
  panelSub:        { fontSize:'10px', color:'var(--muted)', letterSpacing:'0.08em', marginBottom:'2rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--border)' },
  imgPreview:      { width:'100%', aspectRatio:'4/3', background:'#ECEAE4', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.8rem', overflow:'hidden' },
  formActions:     { display:'flex', gap:'0.5rem', marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border)', marginBottom:'2rem' },
  listPanel:       { padding:'2rem', overflowY:'auto' as const },
  listHeader:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' },
  projectGrid:     { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1.2rem' },
  card:            { background:'#fff', border:'1px solid var(--border)', overflow:'hidden', cursor:'pointer' },
  cardSelected:    { borderColor:'var(--fg)' },
  cardThumb:       { aspectRatio:'4/3', background:'#ECEAE4', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  cardInfo:        { padding:'0.8rem 1rem', borderTop:'1px solid var(--border)' },
  cardTag:         { fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--muted)', marginBottom:'0.2rem' },
  cardTitle:       { fontFamily:'DM Serif Display, serif', fontSize:'0.95rem', marginBottom:'0.5rem' },
  liveEditBtn:     { display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.4rem 1rem', background:'#C8B89A', color:'#1A1A18', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, textDecoration:'none', whiteSpace:'nowrap' as const },
  toast:           { position:'fixed' as const, bottom:'2rem', right:'2rem', background:'var(--fg)', color:'var(--bg)', padding:'0.8rem 1.5rem', fontSize:'11px', letterSpacing:'0.08em', zIndex:999 },
}
