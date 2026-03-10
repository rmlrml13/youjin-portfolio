'use client'
// components/admin/ProjectEditor.tsx
import { useState, useRef, useEffect } from 'react'
import type { Project, ProjectBlock } from '@/lib/types'
import BlockEditor from '@/components/portfolio/BlockEditor'
import type { BlockEditorHandle } from '@/components/portfolio/BlockEditor'
import { s, COLORS, fmtDate } from './adminStyles'

interface ProjectForm { title: string; tag: string }

interface Props {
  selectedProject: Project | null
  isCreating: boolean
  token: string
  projects: Project[]
  onSaved: (project: Project, isNew: boolean) => void
  onDeleted: (id: number, title: string) => void
  onSessionExpired?: () => void
}

function toForm(p: Project | null): ProjectForm {
  if (!p) return { title: '', tag: '' }
  return { title: p.title, tag: p.tag }
}

export default function ProjectEditor({ selectedProject, isCreating, token, projects, onSaved, onDeleted, onSessionExpired }: Props) {
  const [form,         setForm]         = useState<ProjectForm>(() => toForm(selectedProject))
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(selectedProject?.image_url ?? '')
  const [imgHover,     setImgHover]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [savedProject, setSavedProject] = useState<Project | null>(selectedProject)
  const [previewOpen,  setPreviewOpen]  = useState(false)
  const [liveBlocks,   setLiveBlocks]   = useState<ProjectBlock[]>([])

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const blockEditorRef = useRef<BlockEditorHandle>(null)

  const showEmpty    = !selectedProject && !isCreating
  const blockTarget  = savedProject ?? selectedProject
  const existingTags = Array.from(new Set(projects.map(p => p.tag).filter(Boolean)))

  useEffect(() => {
    setForm(toForm(selectedProject))
    setImageFile(null)
    setImagePreview(selectedProject?.image_url ?? '')
    setSavedProject(selectedProject)
    setLiveBlocks([])
  }, [selectedProject?.id])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleImageRemove() {
    setImagePreview(''); setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!form.title || !form.tag) { alert('제목과 태그는 필수입니다.'); return }
    setSaving(true)

    // 블록 내용 먼저 flush
    await blockEditorRef.current?.flush()

    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('tag',   form.tag)
    if (!selectedProject) fd.append('sort_order', String(projects.length))
    if (imageFile) fd.append('image', imageFile)
    if (!imagePreview && !imageFile) fd.append('image_url', '')

    const isEdit = !!selectedProject
    const res = await fetch(
      isEdit ? `/api/projects/${selectedProject!.id}` : '/api/projects',
      { method: isEdit ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
    )
    setSaving(false)
    if (res.status === 401) { onSessionExpired?.(); return }
    if (res.ok) {
      const saved: Project = await res.json()
      setSavedProject(saved)
      onSaved(saved, !isEdit)
    } else {
      const e = await res.json(); alert('오류: ' + e.error)
    }
  }

  /* ── 빈 화면 ── */
  if (showEmpty) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: COLORS.bg, gap: '0.75rem',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', marginBottom: '0.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>🗂</div>
        <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: COLORS.inkMid }}>
          프로젝트를 선택하거나
        </p>
        <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.inkFaint }}>
          + 새로 만들기를 눌러주세요
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── 헤더 ── */}
      <div style={{
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: '0 2rem',
        height: 64,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{
            fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: COLORS.accent, fontFamily: 'DM Mono, monospace', fontWeight: 700,
          }}>
            {selectedProject ? `Project #${selectedProject.id}` : '새 프로젝트'}
          </span>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: COLORS.ink, lineHeight: 1.2 }}>
            {form.title || (isCreating ? 'New Project' : '—')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {selectedProject && (
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
              <MetaChip label="등록" value={fmtDate(selectedProject.created_at)} />
              <MetaChip label="조회" value={(selectedProject.view_count ?? 0).toLocaleString()} />
            </div>
          )}
          {/* 미리보기 버튼 */}
          {blockTarget && (
            <button
              onClick={() => setPreviewOpen(o => !o)}
              style={{
                padding: '0.45rem 1rem',
                background: previewOpen ? COLORS.gold : 'transparent',
                color: previewOpen ? '#fff' : COLORS.inkMid,
                border: `1px solid ${previewOpen ? COLORS.gold : COLORS.border}`,
                borderRadius: 3,
                fontFamily: 'DM Mono, monospace', fontSize: '10px',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >▶ 미리보기</button>
          )}
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, display: 'flex' }}>

        {/* 에디터 영역 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>

          {/* 왼쪽: 썸네일 + 태그 */}
          <div style={{
            width: 280, flexShrink: 0,
            borderRight: `1px solid ${COLORS.border}`,
            padding: '1.75rem 1.5rem',
            background: COLORS.surface,
            position: 'sticky', top: 0, alignSelf: 'flex-start',
            minHeight: '100%',
          }}>
            <SectionLabel>썸네일</SectionLabel>
            <div
              style={{
                width: '100%', aspectRatio: '4/3',
                background: COLORS.bg, overflow: 'hidden', cursor: 'pointer',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px dashed ${imagePreview ? 'transparent' : COLORS.borderMid}`,
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setImgHover(true)}
              onMouseLeave={() => setImgHover(false)}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {imgHover && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}>
                      <ImgBtn onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>변경</ImgBtn>
                      <ImgBtn ghost onClick={e => { e.stopPropagation(); handleImageRemove() }}>제거</ImgBtn>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', color: COLORS.goldLight, marginBottom: '0.5rem' }}>↑</div>
                  <span style={{ fontSize: '10px', color: COLORS.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    클릭하여 업로드
                  </span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: '1.5rem 0' }} />

            {/* 태그 */}
            <SectionLabel>태그 *</SectionLabel>
            <input
              style={{ ...s.input, marginTop: 0 }}
              placeholder="직접 입력 또는 아래 선택"
              value={form.tag}
              onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = COLORS.gold)}
              onBlur={e => (e.target.style.borderColor = COLORS.border)}
            />
            {existingTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                {existingTags.map(tag => {
                  const isActive = form.tag === tag
                  return (
                    <button key={tag} onClick={() => setForm(p => ({ ...p, tag }))}
                      style={{
                        padding: '0.25rem 0.7rem',
                        background: isActive ? COLORS.ink : COLORS.hover,
                        color: isActive ? '#fff' : COLORS.inkMid,
                        border: `1px solid ${isActive ? COLORS.ink : COLORS.border}`,
                        fontFamily: 'DM Mono, monospace', fontSize: '10px',
                        letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
                        transition: 'all 0.12s',
                      }}
                    >{tag}</button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 오른쪽: 제목 + BlockEditor */}
          <div style={{ flex: 1, minWidth: 0, padding: '1.75rem 2rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 제목 */}
            <div style={{ paddingBottom: '1.5rem', borderBottom: `1px solid ${COLORS.border}` }}>
              <SectionLabel>제목 *</SectionLabel>
              <input
                style={{
                  ...s.input, marginTop: 0,
                  fontSize: '18px',
                  fontFamily: 'DM Serif Display, serif',
                  padding: '0.75rem 1rem',
                }}
                placeholder="Project Title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = COLORS.gold)}
                onBlur={e => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* 콘텐츠 블록 */}
            <div>
              <SectionLabel>콘텐츠</SectionLabel>
              {blockTarget ? (
                <BlockEditor
                  ref={blockEditorRef}
                  projectId={blockTarget.id}
                  token={token}
                  onBlocksChange={setLiveBlocks}
                />
              ) : (
                <div style={{
                  border: `2px dashed ${COLORS.border}`, borderRadius: 4,
                  padding: '2.5rem', textAlign: 'center', background: COLORS.surface,
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>📝</div>
                  <p style={{ fontSize: '11px', color: COLORS.inkMid, marginBottom: '0.3rem' }}>기본 정보를 먼저 저장하면</p>
                  <p style={{ fontSize: '11px', color: COLORS.inkFaint }}>콘텐츠 편집이 활성화됩니다</p>
                </div>
              )}
            </div>

            {/* 저장 / 삭제 */}
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '0.75rem', marginTop: '1rem',
              paddingTop: '2rem', borderTop: `1px solid ${COLORS.border}`,
            }}>
              {selectedProject && (
                <button
                  onClick={() => onDeleted(selectedProject.id, selectedProject.title)}
                  style={{
                    padding: '0.65rem 1.5rem',
                    background: 'transparent', color: COLORS.red,
                    fontFamily: 'DM Mono, monospace', fontSize: '11px',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: `1px solid ${COLORS.red}`, cursor: 'pointer', borderRadius: 2,
                    opacity: 0.75, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
                >삭제</button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '0.75rem 3rem',
                  background: saving ? COLORS.inkLight : COLORS.ink,
                  color: '#fff', border: 'none',
                  fontFamily: 'DM Mono, monospace', fontSize: '12px',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: saving ? 'default' : 'pointer', borderRadius: 2,
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'background 0.15s',
                }}
              >
                {saving
                  ? <><Spinner /> 저장 중...</>
                  : isCreating ? '+ 등록' : '✓ 저장'
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── 미리보기 패널 ── */}
        {previewOpen && blockTarget && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setPreviewOpen(false)}
            />
            <div style={{
              width: 380, flexShrink: 0,
              borderLeft: `1px solid ${COLORS.border}`,
              background: '#fff',
              overflowY: 'auto',
              position: 'fixed', right: 0, top: 0, bottom: 0,
              zIndex: 50,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            }}>
              {/* 미리보기 헤더 */}
              <div style={{
                padding: '1rem 1.25rem',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: COLORS.surface, position: 'sticky', top: 0, zIndex: 1,
              }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace' }}>
                  미리보기
                </span>
                <button
                  onClick={() => setPreviewOpen(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: COLORS.inkMid, fontSize: '16px', lineHeight: 1, padding: '2px 6px',
                  }}
                >✕</button>
              </div>

              {/* 미리보기 내용 */}
              <div style={{ padding: '1.5rem' }}>
                {imagePreview && (
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', marginBottom: '1rem', background: COLORS.bg }}>
                    <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {form.tag && (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.65rem',
                    background: COLORS.hover,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 100,
                    fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: COLORS.gold, fontFamily: 'DM Mono, monospace',
                    marginBottom: '0.6rem',
                  }}>{form.tag}</span>
                )}
                {form.title && (
                  <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: COLORS.ink, marginBottom: '1.25rem', lineHeight: 1.3 }}>
                    {form.title}
                  </h2>
                )}
                <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, marginBottom: '1.25rem' }} />
                {liveBlocks.length === 0 ? (
                  <p style={{ fontSize: '11px', color: COLORS.inkFaint, fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                    콘텐츠를 입력하면 여기에 표시됩니다
                  </p>
                ) : (
                  liveBlocks.map(block => <PreviewBlock key={block.id} block={block} />)
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── 미리보기 블록 렌더러 ── */
function PreviewBlock({ block }: { block: ProjectBlock }) {
  function getEmbed(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
    const vm = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`
    return null
  }

  switch (block.type) {
    case 'heading':
      return (
        <div style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.25rem', color: COLORS.ink, lineHeight: 1.3 }}
            dangerouslySetInnerHTML={{ __html: block.content }} />
        </div>
      )
    case 'text':
      return (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '14px', color: COLORS.inkMid, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: block.content }} />
        </div>
      )
    case 'image':
      return block.image_url ? (
        <div style={{ marginBottom: '1rem' }}>
          <img src={block.image_url} alt="" style={{ width: '100%', display: 'block', borderRadius: 2 }} />
        </div>
      ) : null
    case 'video': {
      const embedUrl = getEmbed(block.content)
      return block.content ? (
        <div style={{ marginBottom: '1rem', aspectRatio: '16/9', background: '#000', borderRadius: 2, overflow: 'hidden' }}>
          {embedUrl
            ? <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
            : <video src={block.content} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          }
        </div>
      ) : null
    }
    case 'divider':
      return <hr style={{ border: 'none', borderTop: `1px solid ${COLORS.border}`, margin: '1rem 0' }} />
    default:
      return null
  }
}

function getEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

/* ── 소컴포넌트 ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
      color: COLORS.inkFaint, fontWeight: 700, marginBottom: '0.6rem', marginTop: 0,
      fontFamily: 'DM Mono, monospace',
    }}>{children}</p>
  )
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: 'center' }}>
      <span style={{ fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.inkFaint, fontFamily: 'DM Mono, monospace' }}>{label}</span>
      <span style={{ fontSize: '11px', color: COLORS.inkMid, fontFamily: 'DM Mono, monospace' }}>{value}</span>
    </span>
  )
}

function ImgBtn({ children, onClick, ghost }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; ghost?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.4rem 1.2rem',
      background: ghost ? 'transparent' : '#fff',
      color: ghost ? '#fff' : COLORS.ink,
      border: ghost ? '1px solid rgba(255,255,255,0.6)' : 'none',
      fontFamily: 'DM Mono, monospace', fontSize: '10px',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      cursor: 'pointer', width: 80, borderRadius: 2,
    }}>{children}</button>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10,
      border: '1.5px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  )
}
