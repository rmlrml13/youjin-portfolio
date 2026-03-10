'use client'
// app/admin/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Project, Insight } from '@/lib/types'
import AdminLogin      from '@/components/admin/AdminLogin'
import AdminHeader     from '@/components/admin/AdminHeader'
import AdminSidebar    from '@/components/admin/AdminSidebar'
import ProjectEditor   from '@/components/admin/ProjectEditor'
import InsightEditor   from '@/components/admin/InsightEditor'
import ContactManager  from '@/components/admin/ContactManager'

type MainTab = 'projects' | 'insights' | 'contacts'

export default function AdminPage() {
  /* ── Auth ── */
  const [token,    setToken]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [toast,    setToast]    = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const tokenRef = useRef('')

  /* ── 탭 ── */
  const [mainTab, setMainTab] = useState<MainTab>('projects')

  /* ── Projects ── */
  const [projects,          setProjects]          = useState<Project[]>([])
  const [selectedProject,   setSelectedProject]   = useState<Project | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  /* ── Insights ── */
  const [insights,          setInsights]          = useState<Insight[]>([])
  const [selectedInsight,   setSelectedInsight]   = useState<Insight | null>(null)
  const [isCreatingInsight, setIsCreatingInsight] = useState(false)

  /* ── Contacts ── */
  const [contactNewCount, setContactNewCount] = useState(0)

  /* ── tokenRef 동기화 ── */
  function applyToken(tk: string) {
    tokenRef.current = tk
    setToken(tk)
  }

  /* ── 세션 만료 처리 ── */
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('youjin_token')
    tokenRef.current = ''
    setToken('')
    setProjects([]); setInsights([])
    setSelectedProject(null); setSelectedInsight(null)
    setIsCreatingProject(false); setIsCreatingInsight(false)
    setContactNewCount(0)
    setSessionExpired(true)
  }, [])

  /* ── 인증 fetch 래퍼 — 401 감지 시 세션 만료 처리 ── */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${tokenRef.current}`,
      },
    })
    if (res.status === 401) {
      handleSessionExpired()
      throw new Error('SESSION_EXPIRED')
    }
    return res
  }, [handleSessionExpired])

  /* ── 초기 로드 ── */
  useEffect(() => {
    const saved = localStorage.getItem('youjin_token')
    if (!saved) return
    try {
      const payload = JSON.parse(atob(saved.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('youjin_token')
        setSessionExpired(true)
        return
      }
    } catch { localStorage.removeItem('youjin_token'); return }
    applyToken(saved)
    fetchProjects()
    fetchInsights()
    fetchContactNewCount(saved)
  }, [])

  /* ── Auth ── */
  async function doLogin() {
    setLoginErr('')
    setSessionExpired(false)
    const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password }) })
    const data = await res.json()
    if (!res.ok) { setLoginErr(data.error); return }
    localStorage.setItem('youjin_token', data.token)
    applyToken(data.token)
    fetchProjects()
    fetchInsights()
    fetchContactNewCount(data.token)
  }

  function doLogout() {
    localStorage.removeItem('youjin_token')
    tokenRef.current = ''
    setToken(''); setProjects([]); setInsights([])
    setSelectedProject(null); setSelectedInsight(null)
    setIsCreatingProject(false); setIsCreatingInsight(false)
    setContactNewCount(0)
    setSessionExpired(false)
  }

  /* ── Projects CRUD ── */
  async function fetchProjects() {
    const data = await fetch('/api/projects').then(r => r.json()).catch(() => [])
    setProjects(Array.isArray(data) ? data : [])
  }

  function selectProject(p: Project) { setSelectedProject(p); setIsCreatingProject(false) }
  function newProject() { setSelectedProject(null); setIsCreatingProject(true) }

  async function deleteProject(id: number, title: string) {
    if (!confirm(`"${title}" 프로젝트를 삭제할까요?`)) return
    try {
      await authFetch(`/api/projects/${id}`, { method: 'DELETE' })
      showToast('✓ 삭제 완료')
      setSelectedProject(null); setIsCreatingProject(false)
      fetchProjects()
    } catch (e: any) { if (e.message !== 'SESSION_EXPIRED') throw e }
  }

  function handleProjectSaved(saved: Project, isNew: boolean) {
    showToast(isNew ? '✓ 추가 완료' : '✓ 수정 완료')
    fetchProjects()
    setSelectedProject(saved)
    setIsCreatingProject(false)
  }

  /* ── Insights CRUD ── */
  async function fetchInsights() {
    const data = await fetch('/api/insights').then(r => r.json()).catch(() => [])
    setInsights(Array.isArray(data) ? data : [])
  }

  function selectInsight(ins: Insight) { setSelectedInsight(ins); setIsCreatingInsight(false) }
  function newInsight() { setSelectedInsight(null); setIsCreatingInsight(true) }

  function handleInsightSaved(saved: Insight, isNew: boolean) {
    showToast(isNew ? '✓ 등록 완료' : '✓ 저장 완료')
    fetchInsights()
    setSelectedInsight(saved)
    setIsCreatingInsight(false)
  }

  function handleInsightDeleted() {
    showToast('✓ 삭제 완료')
    setSelectedInsight(null); setIsCreatingInsight(false)
    fetchInsights()
  }

  /* ── Contacts ── */
  async function fetchContactNewCount(tk: string) {
    const res  = await fetch('/api/contact?status=new', { headers: { Authorization: `Bearer ${tk}` } }).catch(() => null)
    const data = await res?.json().catch(() => [])
    setContactNewCount(Array.isArray(data) ? data.length : 0)
  }

  /* ── 드래그 앤 드롭 순서 저장 ── */
  async function handleReorderProjects(reordered: Project[]) {
    setProjects(reordered)
    try {
      await Promise.all(
        reordered.map((p, i) =>
          authFetch(`/api/projects/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: i }),
          })
        )
      )
    } catch (e: any) { if (e.message !== 'SESSION_EXPIRED') throw e }
  }

  async function handleReorderInsights(reordered: Insight[]) {
    setInsights(reordered)
    try {
      await Promise.all(
        reordered.map((ins, i) =>
          authFetch(`/api/insights/${ins.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: i }),
          })
        )
      )
    } catch (e: any) { if (e.message !== 'SESSION_EXPIRED') throw e }
  }

  /* ── 탭 전환 ── */
  function handleTabChange(tab: MainTab) {
    setMainTab(tab)
    setSelectedProject(null); setIsCreatingProject(false)
    setSelectedInsight(null); setIsCreatingInsight(false)
    // 문의 탭 진입 시 신규 카운트 갱신
    if (tab === 'contacts') fetchContactNewCount(token)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  /* ── 로그인 화면 ── */
  if (!token) return (
    <>
      {/* 세션 만료 모달 */}
      {sessionExpired && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', padding: '2.5rem 2.75rem',
            maxWidth: 380, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            animation: 'fadeUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🔒</span>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: '#1A1A18' }}>세션이 만료되었습니다</p>
            </div>
            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.7 }}>로그인 유효시간이 지났습니다.<br />다시 로그인해 주세요.</p>
            <button
              onClick={() => setSessionExpired(false)}
              style={{
                marginTop: '0.25rem', padding: '0.7rem',
                background: '#1A1A18', color: '#fff', border: 'none',
                fontFamily: 'DM Mono, monospace', fontSize: '11px',
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >확인</button>
          </div>
        </div>
      )}
      <AdminLogin
        username={username} password={password} loginErr={loginErr}
        onUsername={setUsername} onPassword={setPassword} onLogin={doLogin}
      />
    </>
  )

  const projectEditorKey = selectedProject ? `p-${selectedProject.id}` : isCreatingProject ? 'p-new' : 'p-empty'
  const insightEditorKey = selectedInsight ? `i-${selectedInsight.id}` : isCreatingInsight ? 'i-new' : 'i-empty'

  const showSidebar = mainTab !== 'contacts'

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#F5F4F0', overflow:'hidden' }}>

      <AdminHeader
        mainTab={mainTab}
        projectCount={projects.length}
        insightCount={insights.length}
        contactNewCount={contactNewCount}
        onTabChange={handleTabChange}
        onLogout={doLogout}
      />

      <div style={{ flex:1, display:'grid', gridTemplateColumns: showSidebar ? '280px 1fr' : '1fr', overflow:'hidden' }}>

        {/* 사이드바 — contacts 탭에선 숨김 */}
        {showSidebar && (
          <AdminSidebar
            mainTab={mainTab as 'projects' | 'insights'}
            projects={projects}
            insights={insights}
            selectedProject={selectedProject}
            selectedInsight={selectedInsight}
            onSelectProject={selectProject}
            onSelectInsight={selectInsight}
            onDeleteProject={deleteProject}
            onNew={mainTab === 'projects' ? newProject : newInsight}
            onReorderProjects={handleReorderProjects}
            onReorderInsights={handleReorderInsights}
          />
        )}

        <main style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {mainTab === 'projects' && (
            <ProjectEditor
              key={projectEditorKey}
              selectedProject={selectedProject}
              isCreating={isCreatingProject}
              token={token}
              projects={projects}
              onSaved={handleProjectSaved}
              onDeleted={deleteProject}
              onSessionExpired={handleSessionExpired}
            />
          )}
          {mainTab === 'insights' && (
            <InsightEditor
              key={insightEditorKey}
              selectedInsight={selectedInsight}
              isCreating={isCreatingInsight}
              token={token}
              insights={insights}
              onSaved={(saved, isNew) => handleInsightSaved(saved, isNew)}
              onDeleted={handleInsightDeleted}
              onSessionExpired={handleSessionExpired}
            />
          )}
          {mainTab === 'contacts' && (
            <ContactManager
              token={token}
              onNewCountChange={setContactNewCount}
              onSessionExpired={handleSessionExpired}
            />
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
