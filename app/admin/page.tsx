'use client'
// app/admin/page.tsx
// 상태·데이터 페칭만 담당, UI는 각 컴포넌트에 위임
import { useState, useEffect } from 'react'
import type { Project, Insight } from '@/lib/types'
import AdminLogin    from '@/components/admin/AdminLogin'
import AdminHeader   from '@/components/admin/AdminHeader'
import AdminSidebar  from '@/components/admin/AdminSidebar'
import ProjectEditor from '@/components/admin/ProjectEditor'
import InsightEditor from '@/components/admin/InsightEditor'

type MainTab = 'projects' | 'insights'

export default function AdminPage() {
  /* ── Auth ── */
  const [token,    setToken]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [toast,    setToast]    = useState('')

  /* ── 탭 ── */
  const [mainTab, setMainTab] = useState<MainTab>('projects')

  /* ── Projects ── */
  const [projects,        setProjects]        = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  /* ── Insights ── */
  const [insights,        setInsights]        = useState<Insight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [isCreatingInsight, setIsCreatingInsight] = useState(false)

  /* ── 초기 로드 ── */
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

  /* ── Auth ── */
  async function doLogin() {
    setLoginErr('')
    const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password }) })
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
    setIsCreatingProject(false); setIsCreatingInsight(false)
  }

  /* ── Projects CRUD ── */
  async function fetchProjects() {
    const data = await fetch('/api/projects').then(r => r.json()).catch(() => [])
    setProjects(Array.isArray(data) ? data : [])
  }

  function selectProject(p: Project) {
    setSelectedProject(p)
    setIsCreatingProject(false)
  }

  function newProject() {
    setSelectedProject(null)
    setIsCreatingProject(true)
  }

  async function deleteProject(id: number, title: string) {
    if (!confirm(`"${title}" 프로젝트를 삭제할까요?`)) return
    await fetch(`/api/projects/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    showToast('✓ 삭제 완료')
    setSelectedProject(null); setIsCreatingProject(false)
    fetchProjects()
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

  function selectInsight(ins: Insight) {
    setSelectedInsight(ins)
    setIsCreatingInsight(false)
  }

  function newInsight() {
    setSelectedInsight(null)
    setIsCreatingInsight(true)
  }

  function handleInsightSaved() {
    showToast('✓ 저장 완료')
    setSelectedInsight(null); setIsCreatingInsight(false)
    fetchInsights()
  }

  function handleInsightDeleted() {
    showToast('✓ 삭제 완료')
    setSelectedInsight(null); setIsCreatingInsight(false)
    fetchInsights()
  }

  /* ── 탭 전환 ── */
  function handleTabChange(tab: MainTab) {
    setMainTab(tab)
    setSelectedProject(null); setIsCreatingProject(false)
    setSelectedInsight(null); setIsCreatingInsight(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  /* ── 로그인 화면 ── */
  if (!token) return (
    <AdminLogin
      username={username} password={password} loginErr={loginErr}
      onUsername={setUsername} onPassword={setPassword} onLogin={doLogin}
    />
  )

  // ProjectEditor / InsightEditor는 선택 대상이 바뀔 때 key로 리마운트해서 폼 초기화
  const projectEditorKey = selectedProject ? `p-${selectedProject.id}` : isCreatingProject ? 'p-new' : 'p-empty'
  const insightEditorKey = selectedInsight ? `i-${selectedInsight.id}` : isCreatingInsight ? 'i-new' : 'i-empty'

  /* ── 어드민 본체 ── */
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#F5F4F0', overflow:'hidden' }}>

      <AdminHeader
        mainTab={mainTab}
        projectCount={projects.length}
        insightCount={insights.length}
        onTabChange={handleTabChange}
        onLogout={doLogout}
      />

      <div style={{ flex:1, display:'grid', gridTemplateColumns:'280px 1fr', overflow:'hidden' }}>

        <AdminSidebar
          mainTab={mainTab}
          projects={projects}
          insights={insights}
          selectedProject={selectedProject}
          selectedInsight={selectedInsight}
          onSelectProject={selectProject}
          onSelectInsight={selectInsight}
          onDeleteProject={deleteProject}
          onNew={mainTab === 'projects' ? newProject : newInsight}
        />

        <main style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {mainTab === 'projects' && (
            <ProjectEditor
              key={projectEditorKey}
              selectedProject={selectedProject}
              isCreating={isCreatingProject}
              token={token}
              onSaved={handleProjectSaved}
              onDeleted={deleteProject}
            />
          )}
          {mainTab === 'insights' && (
            <InsightEditor
              key={insightEditorKey}
              selectedInsight={selectedInsight}
              isCreating={isCreatingInsight}
              token={token}
              onSaved={handleInsightSaved}
              onDeleted={handleInsightDeleted}
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
