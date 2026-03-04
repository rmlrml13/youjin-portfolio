'use client'
// components/admin/ProjectEditor.tsx
import { useState, useRef, useEffect } from 'react'
import type { Project } from '@/lib/types'
import BlockEditor from '@/components/portfolio/BlockEditor'
import { s, fmtDate } from './adminStyles'

interface ProjectForm { title: string; tag: string }

interface Props {
  selectedProject: Project | null
  isCreating: boolean
  token: string
  projects: Project[]           // 전체 목록 — 태그 뱃지용
  onSaved: (project: Project, isNew: boolean) => void
  onDeleted: (id: number, title: string) => void
}

function toForm(p: Project | null): ProjectForm {
  if (!p) return { title: '', tag: '' }
  return { title: p.title, tag: p.tag }
}

export default function ProjectEditor({ selectedProject, isCreating, token, projects, onSaved, onDeleted }: Props) {
  const [form,         setForm]         = useState<ProjectForm>(() => toForm(selectedProject))
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(selectedProject?.image_url ?? '')
  const [imgHover,     setImgHover]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [savedProject, setSavedProject] = useState<Project | null>(selectedProject)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showEmpty   = !selectedProject && !isCreating
  const blockTarget = savedProject ?? selectedProject

  // 기존 태그 중복 제거
  const existingTags = Array.from(new Set(projects.map(p => p.tag).filter(Boolean)))

  useEffect(() => {
    setForm(toForm(selectedProject))
    setImageFile(null)
    setImagePreview(selectedProject?.image_url ?? '')
    setSavedProject(selectedProject)
  }, [selectedProject?.id])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleImageRemove() {
    setImagePreview('')
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!form.title || !form.tag) { alert('제목과 태그는 필수입니다.'); return }
    setSaving(true)

    const fd = new FormData()
    fd.append('title',    form.title)
    fd.append('tag',      form.tag)
    fd.append('col_size', 'col-6')
    if (imageFile) fd.append('image', imageFile)
    // 이미지 제거된 경우
    if (!imagePreview && !imageFile) fd.append('image_url', '')

    const isEdit = !!selectedProject
    const res = await fetch(
      isEdit ? `/api/projects/${selectedProject!.id}` : '/api/projects',
      { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
    )
    setSaving(false)
    if (res.ok) {
      const saved: Project = await res.json()
      setSavedProject(saved)
      onSaved(saved, !isEdit)
    } else {
      const e = await res.json(); alert('오류: ' + e.error)
    }
  }

  return (
    <>
      {/* 헤더 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #D0CEC8', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', marginBottom: '0.2rem' }}>
            {selectedProject ? `Project #${selectedProject.id}` : '새 프로젝트'}
          </p>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: '#1A1A18', marginBottom: selectedProject ? '0.5rem' : 0 }}>
            {selectedProject ? (form.title || selectedProject.title || '—') : 'New Project'}
          </h2>
          {selectedProject && (
            <div style={{ display: 'flex', gap: '1.2rem' }}>
              <span style={s.metaChip}><span style={s.metaChipLabel}>등록</span>{fmtDate(selectedProject.created_at)}</span>
              {selectedProject.updated_at && selectedProject.updated_at !== selectedProject.created_at && (
                <span style={s.metaChip}><span style={s.metaChipLabel}>수정</span>{fmtDate(selectedProject.updated_at)}</span>
              )}
              <span style={s.metaChip}><span style={s.metaChipLabel}>조회</span>{(selectedProject.view_count ?? 0).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {showEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#666' }}>프로젝트를 선택하거나</p>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>새로 만들기를 눌러주세요</p>
          </div>
        )}

        {!showEmpty && (
          <div style={{ display: 'flex', alignItems: 'flex-start', height: '100%' }}>

            {/* ── 왼쪽: 썸네일 + 태그 사이드바 ── */}
            <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #D0CEC8', padding: '2rem 1.5rem', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>

              {/* 썸네일 */}
              <p style={{ ...s.label, marginBottom: '0.75rem', marginTop: 0 }}>썸네일</p>
              <div
                style={{ width: '100%', aspectRatio: '3/4', background: '#ECEAE4', overflow: 'hidden', cursor: imagePreview ? 'default' : 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => { if (!imagePreview) fileInputRef.current?.click() }}
                onMouseEnter={() => setImgHover(true)}
                onMouseLeave={() => setImgHover(false)}
              >
                {imagePreview
                  ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <div style={{ fontSize: '1.8rem', color: '#C8B89A', marginBottom: '0.4rem' }}>↑</div>
                      <span style={{ fontSize: '10px', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>클릭하여 업로드</span>
                    </div>
                }
                {imagePreview && imgHover && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                      style={{ padding: '0.4rem 1.2rem', background: '#fff', color: '#1A1A18', border: 'none', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', width: '90px' }}>
                      변경
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleImageRemove() }}
                      style={{ padding: '0.4rem 1.2rem', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.7)', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', width: '90px' }}>
                      제거
                    </button>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

              {/* 태그 — 썸네일 바로 아래 */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E0DED8' }}>
                <label style={{ ...s.label, marginTop: 0, marginBottom: '0.5rem' }}>태그 *</label>
                <input
                  style={{ ...s.input, fontSize: '12px' }}
                  placeholder="직접 입력 또는 아래 선택"
                  value={form.tag}
                  onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
                />
                {existingTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                    {existingTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setForm(p => ({ ...p, tag }))}
                        style={{
                          padding: '0.25rem 0.65rem',
                          background: form.tag === tag ? '#1A1A18' : '#F0EEE8',
                          color: form.tag === tag ? '#fff' : '#555',
                          border: form.tag === tag ? '1px solid #1A1A18' : '1px solid #D0CEC8',
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '10px',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          transition: 'all 0.12s',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── 오른쪽: 제목 + 블록 에디터 ── */}
            <div style={{ flex: 1, minWidth: 0, padding: '2rem 2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* 제목 */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #D0CEC8' }}>
                <label style={s.label}>제목 *</label>
                <input
                  style={{ ...s.input, fontSize: '15px' }}
                  placeholder="Project Title"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* 콘텐츠 블록 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                  <p style={s.sectionLabel}>콘텐츠 블록</p>
                </div>
                {blockTarget ? (
                  <BlockEditor projectId={blockTarget.id} token={token} />
                ) : (
                  <div style={{ border: '1.5px dashed #D0CEC8', padding: '2.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.3rem' }}>기본 정보를 저장하면</p>
                    <p style={{ fontSize: '11px', color: '#aaa' }}>콘텐츠 블록 편집이 활성화됩니다</p>
                  </div>
                )}
              </div>

              {/* 저장 / 삭제 */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid #D0CEC8' }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '0.85rem 2.5rem', background: '#1A1A18', color: '#fff', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
                {selectedProject && (
                  <button onClick={() => onDeleted(selectedProject.id, selectedProject.title)}
                    style={{ padding: '0.85rem 1.4rem', background: 'transparent', color: '#C0392B', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid #C0392B', cursor: 'pointer' }}>
                    삭제
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  )
}
