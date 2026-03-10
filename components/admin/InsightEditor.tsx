'use client'
// components/admin/InsightEditor.tsx
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Insight } from '@/lib/types'
import { s, fmtDate } from './adminStyles'

const TiptapEditor = dynamic(
  () => import('@/components/insight/TiptapEditor'),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '500px', border: '1px solid #D0CEC8', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', color: '#999', letterSpacing: '0.1em' }}>에디터 불러오는 중...</span>
      </div>
    ),
  }
)

interface InsightForm { category: string; title: string }

interface Props {
  selectedInsight: Insight | null
  isCreating: boolean
  token: string
  insights: Insight[]
  onSaved: (saved: Insight, isNew: boolean) => void
  onDeleted: () => void
  onSessionExpired?: () => void
}

function toForm(ins: Insight | null): InsightForm {
  if (!ins) return { category: '', title: '' }
  return { category: ins.category, title: ins.title }
}

export default function InsightEditor({ selectedInsight, isCreating, token, insights, onSaved, onDeleted, onSessionExpired }: Props) {
  const [form,         setForm]         = useState<InsightForm>(() => toForm(selectedInsight))
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(selectedInsight?.thumbnail_url ?? '')
  const [imgHover,     setImgHover]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [editorKey,    setEditorKey]    = useState(0)
  const htmlRef      = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showEmpty = !selectedInsight && !isCreating

  // 기존 카테고리 중복 제거
  const existingCategories = Array.from(new Set(insights.map(i => i.category).filter(Boolean)))

  useEffect(() => {
    setForm(toForm(selectedInsight))
    setImageFile(null)
    setImagePreview(selectedInsight?.thumbnail_url ?? '')
    htmlRef.current = selectedInsight?.content_html ?? ''
    setEditorKey(k => k + 1)
  }, [selectedInsight?.id])

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
    if (!form.category || !form.title) { alert('카테고리와 제목은 필수입니다.'); return }
    setSaving(true)

    // 썸네일 URL 결정: 새 파일 업로드 → 기존 URL 유지 → 제거된 경우 빈 문자열
    let thumbnail_url: string = imagePreview  // 기본값: 현재 미리보기 (기존 URL 또는 '')

    if (imageFile) {
      const fd = new FormData()
      fd.append('image', imageFile)
      const uploadRes = await fetch('/api/upload?folder=insights', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!uploadRes.ok) { setSaving(false); alert('이미지 업로드 실패'); return }
      thumbnail_url = (await uploadRes.json()).url
    }

    const isEdit = !!selectedInsight
    const body = {
      category:      form.category,
      title:         form.title,
      content_html:  htmlRef.current,
      thumbnail_url,
    }

    const res = await fetch(
      isEdit ? `/api/insights/${selectedInsight!.id}` : '/api/insights',
      { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }
    )
    setSaving(false)
    if (res.status === 401) { onSessionExpired?.(); return }
    if (res.ok) { onSaved(await res.json(), !isEdit) }
    else { const e = await res.json(); alert('오류: ' + e.error) }
  }

  async function handleDelete() {
    if (!selectedInsight || !confirm(`"${selectedInsight.title}" 항목을 삭제할까요?`)) return
    await fetch(`/api/insights/${selectedInsight.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    onDeleted()
  }

  return (
    <>
      {/* 헤더 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #D0CEC8', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999', marginBottom: '0.2rem' }}>
            {selectedInsight ? `Insight #${selectedInsight.id}` : '새 글'}
          </p>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: '#1A1A18', marginBottom: selectedInsight ? '0.5rem' : 0 }}>
            {selectedInsight ? (form.title || '—') : 'New Insight'}
          </h2>
          {selectedInsight && (
            <div style={{ display: 'flex', gap: '1.2rem' }}>
              <span style={s.metaChip}><span style={s.metaChipLabel}>등록</span>{fmtDate(selectedInsight.created_at)}</span>
              {selectedInsight.updated_at && selectedInsight.updated_at !== selectedInsight.created_at && (
                <span style={s.metaChip}><span style={s.metaChipLabel}>수정</span>{fmtDate(selectedInsight.updated_at)}</span>
              )}
              <span style={s.metaChip}><span style={s.metaChipLabel}>조회</span>{(selectedInsight.view_count ?? 0).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {showEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', marginBottom: '0.5rem', color: '#666' }}>글을 선택하거나</p>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>새로 만들기를 눌러주세요</p>
          </div>
        )}

        {!showEmpty && (
          <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '100%' }}>

            {/* ── 왼쪽: 썸네일 + 카테고리 사이드바 ── */}
            <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #D0CEC8', padding: '2rem 1.5rem', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>

              {/* 썸네일 */}
              <p style={{ ...s.label, marginBottom: '0.75rem', marginTop: 0 }}>썸네일</p>
              <div
                style={{ width: '100%', aspectRatio: '3/4', background: '#ECEAE4', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: imagePreview ? 'default' : 'pointer' }}
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

              {/* 카테고리 — 썸네일 바로 아래 */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E0DED8' }}>
                <label style={{ ...s.label, marginTop: 0, marginBottom: '0.5rem' }}>카테고리 *</label>
                <input
                  style={{ ...s.input, fontSize: '12px' }}
                  placeholder="직접 입력 또는 아래 선택"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                />
                {/* 기존 카테고리 뱃지 */}
                {existingCategories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                    {existingCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setForm(p => ({ ...p, category: cat }))}
                        style={{
                          padding: '0.25rem 0.65rem',
                          background: form.category === cat ? '#1A1A18' : '#F0EEE8',
                          color: form.category === cat ? '#fff' : '#555',
                          border: form.category === cat ? '1px solid #1A1A18' : '1px solid #D0CEC8',
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '10px',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          transition: 'all 0.12s',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── 오른쪽: 제목 + 에디터 ── */}
            <div style={{ flex: 1, minWidth: 0, padding: '2rem 2rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* 제목 */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #D0CEC8' }}>
                <label style={s.label}>제목 *</label>
                <input
                  style={{ ...s.input, fontSize: '15px' }}
                  placeholder="글 제목을 입력하세요"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* TipTap 에디터 */}
              <TiptapEditor key={editorKey} content={htmlRef.current} token={token} onChange={html => { htmlRef.current = html }} />

              {/* 저장 / 삭제 */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid #D0CEC8' }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '0.85rem 2.5rem', background: '#1A1A18', color: '#fff', fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '저장 중...' : (selectedInsight ? '저장' : '글 등록')}
                </button>
                {selectedInsight && (
                  <button onClick={handleDelete}
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
