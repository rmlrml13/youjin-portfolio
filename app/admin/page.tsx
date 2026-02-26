'use client'
// app/admin/page.tsx
import { useState, useEffect, useRef } from 'react'
import type { Project, SiteConfig } from '@/lib/types'
import { DEFAULT_CONFIG } from '@/lib/types'

const ROMAN = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']
const COL_OPTIONS = ['col-4','col-5','col-6','col-7','col-8']
const COL_LABELS: Record<string, string> = {
  'col-4': '좁게 (col-4)', 'col-5': '보통 (col-5)', 'col-6': '중간 (col-6)',
  'col-7': '넓게 (col-7)', 'col-8': '아주 넓게 (col-8)'
}
const HEIGHT_PRESETS = ['300px','400px','500px','600px','700px','800px']
const EMPTY_FORM = { title: '', tag: '', year: '', image_url: '', col_size: 'col-6', sort_order: 0 }

type Tab = 'projects' | 'config'

export default function AdminPage() {
  const [token, setToken]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [tab, setTab]           = useState<Tab>('projects')
  const [toast, setToast]       = useState('')

  // ── Projects ──
  const [projects, setProjects]         = useState<Project[]>([])
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [editId, setEditId]             = useState<number | null>(null)
  const [saving, setSaving]             = useState(false)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Config ──
  const [config, setConfig]             = useState<SiteConfig>(DEFAULT_CONFIG)
  const [configSaving, setConfigSaving] = useState(false)
  const [heroImgFile, setHeroImgFile]   = useState<File | null>(null)
  const [heroImgPreview, setHeroImgPreview] = useState('')
  const [heroImgUploading, setHeroImgUploading] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)

  // 로그인 복원
  useEffect(() => {
    const saved = localStorage.getItem('yujin_token')
    if (saved) { setToken(saved); fetchProjects(); fetchConfig() }
  }, [])

  // ── Auth ──
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
    fetchProjects(); fetchConfig()
  }

  function doLogout() {
    localStorage.removeItem('yujin_token')
    setToken(''); setProjects([])
  }

  // ── Projects ──
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

  // ── Config ──
  async function fetchConfig() {
    const res  = await fetch('/api/config')
    const data = await res.json()
    setConfig(data)
    if (data.hero_image_url) setHeroImgPreview(data.hero_image_url)
  }

  // Hero 이미지 선택 시 즉시 Storage 업로드
  async function handleHeroImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setHeroImgFile(file)

    // 로컬 미리보기
    const reader = new FileReader()
    reader.onload = ev => setHeroImgPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Storage 업로드
    setHeroImgUploading(true)
    const fd = new FormData()
    fd.append('image', file)
    const res  = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    })
    const data = await res.json()
    setHeroImgUploading(false)

    if (res.ok) {
      setConfig(p => ({ ...p, hero_image_url: data.url }))
      showToast('✓ 이미지 업로드 완료 — 저장 버튼을 눌러 반영하세요')
    } else {
      alert('이미지 업로드 실패: ' + data.error)
    }
  }

  function removeHeroImage() {
    setHeroImgFile(null); setHeroImgPreview('')
    setConfig(p => ({ ...p, hero_image_url: '' }))
    if (heroFileRef.current) heroFileRef.current.value = ''
  }

  async function saveConfig() {
    setConfigSaving(true)
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(config)
    })
    setConfigSaving(false)
    if (res.ok) {
      showToast('✓ 사이트 설정 저장 완료')
      // 저장 후 DB 최신값으로 동기화 (이미지 제거 반영)
      await fetchConfig()
    } else {
      const e = await res.json(); alert('오류: ' + e.error)
    }
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
    <div style={{ minHeight: '300px', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={s.adminHeader}>
        <span style={s.adminLogo}>Yujin CMS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            {(['projects', 'config'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ ...s.tabBtn, ...(tab === t ? s.tabBtnActive : {}) }}>
                {t === 'projects' ? '프로젝트' : '사이트 설정'}
              </button>
            ))}
          </div>
          <a href="/" target="_blank" style={s.adminHeaderLink}>← 포트폴리오 보기</a>
          <button style={s.logoutBtn} onClick={doLogout}>로그아웃</button>
        </div>
      </div>

      {/* ════ 탭: 프로젝트 ════ */}
      {tab === 'projects' && (
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
      )}

      {/* ════ 탭: 사이트 설정 ════ */}
      {tab === 'config' && (
        <div style={s.configBody}>
          <div style={s.configGrid}>

            {/* ── Hero 카드 ── */}
            <div style={s.configCard}>
              <h3 style={s.configCardTitle}>Hero 섹션</h3>
              <p style={s.configCardDesc}>메인 상단 이미지, 높이, 이름, 소개 문구를 설정해요.</p>

              {/* 배경 이미지 업로드 */}
              <label style={s.label}>배경 이미지</label>
              <div style={s.heroImgWrap}>
                {heroImgPreview ? (
                  <>
                    {/* 이미지 미리보기 */}
                    <div style={s.heroImgPreview}>
                      <img src={heroImgPreview} alt="hero preview" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    </div>
                    {/* 버튼 행 — 미리보기 아래에 항상 표시 */}
                    <div style={s.heroImgBtnRow}>
                      <button style={s.heroImgChangeBtn} onClick={() => heroFileRef.current?.click()}>
                        {heroImgUploading ? '업로드 중...' : '이미지 변경'}
                      </button>
                      <button style={s.heroImgRemoveBtn} onClick={removeHeroImage}>✕ 이미지 제거</button>
                    </div>
                  </>
                ) : (
                  <div style={{ ...s.heroImgEmpty, cursor: 'pointer' }} onClick={() => heroFileRef.current?.click()}>
                    <div style={{ fontSize:'2rem', color:'var(--accent)', marginBottom:'0.5rem' }}>↑</div>
                    <span style={{ fontSize:'11px', color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase' as const }}>
                      {heroImgUploading ? '업로드 중...' : '클릭하여 이미지 선택'}
                    </span>
                  </div>
                )}
              </div>
              <input ref={heroFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleHeroImageChange} />

              {/* 높이 설정 — 이미지가 있을 때만 표시 */}
              {heroImgPreview && (
                <>
                  <label style={{ ...s.label, marginTop: '1rem' }}>
                    높이
                    <span style={s.hint}> — 직접 입력 또는 프리셋 선택</span>
                  </label>
                  <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem', flexWrap:'wrap' as const }}>
                    {HEIGHT_PRESETS.map(h => (
                      <button key={h} onClick={() => setConfig(p => ({ ...p, hero_height: h }))}
                        style={{ ...s.presetBtn, ...(config.hero_height === h ? s.presetBtnActive : {}) }}>
                        {h}
                      </button>
                    ))}
                  </div>
                  <input style={s.input} value={config.hero_height} placeholder="예: 80vh, 600px"
                    onChange={e => setConfig(p => ({ ...p, hero_height: e.target.value }))} />
                </>
              )}

              {/* 이름 */}
              <label style={s.label}>이름 (로고 & 헤더)</label>
              <input style={s.input} value={config.hero_name}
                onChange={e => setConfig(p => ({ ...p, hero_name: e.target.value }))} />

              {/* 부제목 */}
              <label style={s.label}>
                부제목
                <span style={s.hint}> — "|"로 줄바꿈 (예: Design|&amp; Art|Works)</span>
              </label>
              <input style={s.input} value={config.hero_subtitle}
                onChange={e => setConfig(p => ({ ...p, hero_subtitle: e.target.value }))} />

              {/* 소개 문구 */}
              <label style={s.label}>소개 문구</label>
              <textarea style={{ ...s.input, ...s.textarea }} value={config.hero_desc}
                onChange={e => setConfig(p => ({ ...p, hero_desc: e.target.value }))} />
            </div>

            {/* ── About 카드 ── */}
            <div style={s.configCard}>
              <h3 style={s.configCardTitle}>About 섹션</h3>
              <p style={s.configCardDesc}>자기소개와 스킬 태그를 수정해요.</p>

              <label style={s.label}>소개 문단 1</label>
              <textarea style={{ ...s.input, ...s.textarea }} value={config.about_text1}
                onChange={e => setConfig(p => ({ ...p, about_text1: e.target.value }))} />

              <label style={s.label}>소개 문단 2</label>
              <textarea style={{ ...s.input, ...s.textarea }} value={config.about_text2}
                onChange={e => setConfig(p => ({ ...p, about_text2: e.target.value }))} />

              <label style={s.label}>
                스킬 태그
                <span style={s.hint}> — 콤마(,)로 구분</span>
              </label>
              <input style={s.input} value={config.about_skills}
                onChange={e => setConfig(p => ({ ...p, about_skills: e.target.value }))} />
              <div style={s.skillPreview}>
                {config.about_skills.split(',').map(sk => sk.trim()).filter(Boolean).map(skill => (
                  <span key={skill} style={s.skillPreviewTag}>{skill}</span>
                ))}
              </div>
            </div>

            {/* ── Contact 카드 ── */}
            <div style={s.configCard}>
              <h3 style={s.configCardTitle}>Contact 섹션</h3>
              <p style={s.configCardDesc}>연락처와 SNS 링크를 수정해요.</p>
              {[
                { label: '이메일',        key: 'contact_email',     placeholder: 'hello@yujin.com' },
                { label: 'Instagram URL', key: 'contact_instagram', placeholder: 'https://instagram.com/...' },
                { label: 'Behance URL',   key: 'contact_behance',   placeholder: 'https://behance.net/...' },
                { label: 'LinkedIn URL',  key: 'contact_linkedin',  placeholder: 'https://linkedin.com/in/...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={s.label}>{f.label}</label>
                  <input style={s.input} placeholder={f.placeholder}
                    value={(config as any)[f.key]}
                    onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>

            {/* ── Footer 카드 ── */}
            <div style={s.configCard}>
              <h3 style={s.configCardTitle}>Footer</h3>
              <p style={s.configCardDesc}>하단에 표시되는 이름과 지역이에요.</p>
              <label style={s.label}>이름</label>
              <input style={s.input} value={config.footer_name}
                onChange={e => setConfig(p => ({ ...p, footer_name: e.target.value }))} />
              <label style={s.label}>지역</label>
              <input style={s.input} value={config.footer_region}
                onChange={e => setConfig(p => ({ ...p, footer_region: e.target.value }))} />
            </div>

          </div>

          {/* 저장 버튼 */}
          <div style={s.configSaveBar}>
            <button
              style={{ ...s.btnPrimary, width:'auto', padding:'0.9rem 3rem', opacity: configSaving ? 0.6 : 1 }}
              onClick={saveConfig} disabled={configSaving}>
              {configSaving ? '저장 중...' : '전체 설정 저장'}
            </button>
            <span style={{ fontSize:'11px', color:'var(--muted)' }}>저장 후 포트폴리오에 바로 반영돼요</span>
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

// ── Styles ──
const s: Record<string, React.CSSProperties> = {
  loginWrap:         { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' },
  loginBox:          { width:360, padding:'3rem', border:'1px solid var(--border)', background:'#fff', display:'flex', flexDirection:'column' },
  loginTitle:        { fontFamily:'DM Serif Display, serif', fontSize:'1.8rem', marginBottom:'0.4rem' },
  loginSub:          { color:'var(--muted)', fontSize:'11px', letterSpacing:'0.08em', marginBottom:'2.5rem' },
  label:             { display:'block', fontSize:'10px', letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--muted)', marginBottom:'0.5rem' },
  hint:              { fontSize:'9px', color:'var(--accent)', letterSpacing:'0.04em', textTransform:'none' as const },
  input:             { width:'100%', padding:'0.75rem 1rem', border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'DM Mono, monospace', fontSize:'13px', color:'var(--fg)', outline:'none', marginBottom:'1rem', display:'block' },
  textarea:          { resize:'vertical' as const, minHeight:'80px', lineHeight:'1.6' },
  errMsg:            { color:'#C0392B', fontSize:'11px', marginBottom:'0.8rem' },
  btnPrimary:        { padding:'0.75rem 1.5rem', background:'var(--fg)', color:'var(--bg)', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase' as const, border:'none', cursor:'pointer', width:'100%' },
  btnSecondary:      { padding:'0.75rem 1.5rem', background:'transparent', color:'var(--fg)', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase' as const, border:'1px solid var(--border)', cursor:'pointer', flex:1 },
  btnSm:             { padding:'0.4rem 0.8rem', background:'transparent', color:'var(--fg)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, border:'1px solid var(--border)', cursor:'pointer' },
  btnDanger:         { color:'#C0392B', borderColor:'#C0392B' },
  tabBtn:            { padding:'0.4rem 1rem', background:'transparent', color:'rgba(255,255,255,0.5)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, border:'1px solid transparent', cursor:'pointer' },
  tabBtnActive:      { color:'#fff', borderColor:'rgba(255,255,255,0.3)' },
  adminHeader:       { position:'sticky' as const, top:0, zIndex:100, background:'var(--fg)', color:'var(--bg)', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  adminLogo:         { fontFamily:'DM Serif Display, serif', fontSize:'1.1rem', color:'var(--bg)' },
  adminHeaderLink:   { color:'rgba(255,255,255,0.6)', textDecoration:'none', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' as const },
  logoutBtn:         { background:'none', border:'1px solid rgba(255,255,255,0.3)', color:'rgba(255,255,255,0.8)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, padding:'0.4rem 1rem', cursor:'pointer' },
  adminBody:         { display:'grid', gridTemplateColumns:'340px 1fr', minHeight:'calc(100vh - 56px)' },
  formPanel:         { background:'#fff', borderRight:'1px solid var(--border)', padding:'2rem', overflowY:'auto' as const },
  panelTitle:        { fontFamily:'DM Serif Display, serif', fontSize:'1.2rem', marginBottom:'0.3rem' },
  panelSub:          { fontSize:'10px', color:'var(--muted)', letterSpacing:'0.08em', marginBottom:'2rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--border)' },
  imgPreview:        { width:'100%', aspectRatio:'4/3', background:'#ECEAE4', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.8rem', overflow:'hidden' },
  formActions:       { display:'flex', gap:'0.5rem', marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border)' },
  listPanel:         { padding:'2rem', overflowY:'auto' as const },
  listHeader:        { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' },
  projectGrid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1.2rem' },
  card:              { background:'#fff', border:'1px solid var(--border)', overflow:'hidden', cursor:'pointer' },
  cardSelected:      { borderColor:'var(--fg)' },
  cardThumb:         { aspectRatio:'4/3', background:'#ECEAE4', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  cardInfo:          { padding:'0.8rem 1rem', borderTop:'1px solid var(--border)' },
  cardTag:           { fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--muted)', marginBottom:'0.2rem' },
  cardTitle:         { fontFamily:'DM Serif Display, serif', fontSize:'0.95rem', marginBottom:'0.5rem' },
  configBody:        { padding:'2rem', maxWidth:'1100px', margin:'0 auto' },
  configGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(460px, 1fr))', gap:'1.5rem', marginBottom:'2rem' },
  configCard:        { background:'#fff', border:'1px solid var(--border)', padding:'2rem' },
  configCardTitle:   { fontFamily:'DM Serif Display, serif', fontSize:'1.1rem', marginBottom:'0.3rem' },
  configCardDesc:    { fontSize:'11px', color:'var(--muted)', marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--border)' },
  // Hero 이미지
  heroImgWrap:       { marginBottom:'1rem' },
  heroImgPreview:    { width:'100%', aspectRatio:'16/7', overflow:'hidden', background:'#ECEAE4' },
  heroImgBtnRow:     { display:'flex', gap:'0.5rem', marginTop:'0.6rem' },
  heroImgChangeBtn:  { flex:1, padding:'0.6rem 1rem', background:'var(--fg)', color:'var(--bg)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, border:'none', cursor:'pointer' },
  heroImgRemoveBtn:  { flex:1, padding:'0.6rem 1rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, border:'1px solid #C0392B', cursor:'pointer' },
  heroImgEmpty:      { width:'100%', aspectRatio:'16/7', background:'#ECEAE4', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center' },
  // 높이 프리셋
  presetBtn:         { padding:'0.3rem 0.6rem', background:'transparent', color:'var(--muted)', fontFamily:'DM Mono, monospace', fontSize:'10px', letterSpacing:'0.08em', border:'1px solid var(--border)', cursor:'pointer', marginBottom:'0.5rem' },
  presetBtnActive:   { background:'var(--fg)', color:'var(--bg)', borderColor:'var(--fg)' },
  skillPreview:      { display:'flex', flexWrap:'wrap' as const, gap:'0.4rem', marginTop:'-0.5rem', marginBottom:'0.5rem' },
  skillPreviewTag:   { fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase' as const, padding:'0.3rem 0.7rem', border:'1px solid var(--border)', color:'var(--muted)' },
  configSaveBar:     { display:'flex', alignItems:'center', gap:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border)' },
  toast:             { position:'fixed' as const, bottom:'2rem', right:'2rem', background:'var(--fg)', color:'var(--bg)', padding:'0.8rem 1.5rem', fontSize:'11px', letterSpacing:'0.08em', zIndex:999 },
}
