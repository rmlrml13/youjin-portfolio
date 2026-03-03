'use client'
// components/admin/InsightEditor.tsx
import { useState, useRef } from 'react'
import type { Insight } from '@/lib/types'
import BlockEditor, { type BlockEditorHandle } from '@/components/portfolio/BlockEditor'
import { s, fmtDate } from './adminStyles'

interface InsightForm {
  category: string
  title: string
  sort_order: number
}

interface Props {
  selectedInsight: Insight | null
  isCreating: boolean
  token: string
  onSaved: (saved: Insight, isNew: boolean) => void
  onDeleted: () => void
}

function toForm(ins: Insight | null): InsightForm {
  if (!ins) return { category:'', title:'', sort_order:0 }
  return { category:ins.category, title:ins.title, sort_order:ins.sort_order }
}

export default function InsightEditor({ selectedInsight, isCreating, token, onSaved, onDeleted }: Props) {
  const [form,   setForm]   = useState<InsightForm>(() => toForm(selectedInsight))
  const [saving, setSaving] = useState(false)
  const blockEditorRef = useRef<BlockEditorHandle>(null)

  const showEmpty = !selectedInsight && !isCreating

  async function handleSave() {
    if (!form.category || !form.title) {
      alert('카테고리와 제목은 필수입니다.'); return
    }
    // 편집 중인 블록 먼저 flush
    await blockEditorRef.current?.flush()
    setSaving(true)
    const isEdit = !!selectedInsight
    const body = { ...form, description: '', date: '', read_time: '' }
    const res = await fetch(
      isEdit ? `/api/insights/${selectedInsight!.id}` : '/api/insights',
      { method: isEdit ? 'PUT' : 'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body) }
    )
    setSaving(false)
    if (res.ok) {
      const saved = await res.json()
      onSaved(saved, !isEdit)
    } else {
      const e = await res.json(); alert('오류: ' + e.error)
    }
  }

  async function handleDelete() {
    if (!selectedInsight || !confirm(`"${selectedInsight.title}" 항목을 삭제할까요?`)) return
    await fetch(`/api/insights/${selectedInsight.id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    onDeleted()
  }

  return (
    <>
      {/* 헤더 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E0DED8', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <p style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.2rem' }}>
            {selectedInsight ? `Insight #${selectedInsight.id}` : '새 글'}
          </p>
          <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.15rem', color:'#1A1A18', marginBottom: selectedInsight ? '0.5rem' : 0 }}>
            {selectedInsight ? (form.title || '—') : 'New Insight'}
          </h2>
          {selectedInsight && (
            <div style={{ display:'flex', gap:'1.2rem' }}>
              <span style={s.metaChip}><span style={s.metaChipLabel}>등록</span>{fmtDate(selectedInsight.created_at)}</span>
              {selectedInsight.updated_at && selectedInsight.updated_at !== selectedInsight.created_at && (
                <span style={s.metaChip}><span style={s.metaChipLabel}>수정</span>{fmtDate(selectedInsight.updated_at)}</span>
              )}
              <span style={s.metaChip}><span style={s.metaChipLabel}>조회</span>{(selectedInsight.view_count ?? 0).toLocaleString()}</span>
            </div>
          )}
        </div>
        {selectedInsight && (
          <a href={`/insight/${selectedInsight.id}`} target="_blank"
            style={{ fontSize:'10px', color:'#888880', textDecoration:'none', letterSpacing:'0.08em', textTransform:'uppercase', border:'1px solid #E0DED8', padding:'0.4rem 0.9rem' }}>
            미리보기 ↗
          </a>
        )}
      </div>

      {/* 본문 */}
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* 빈 상태 */}
        {showEmpty && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#C8B89A' }}>
            <p style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.3rem', marginBottom:'0.5rem', color:'#888880' }}>글을 선택하거나</p>
            <p style={{ fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>새로 만들기를 눌러주세요</p>
          </div>
        )}

        {!showEmpty && (
          <div style={{ maxWidth:760, padding:'2.5rem 2rem' }}>

            {/* 카테고리 + 제목 */}
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'1rem', marginBottom:'2rem', paddingBottom:'2rem', borderBottom:'1px solid #E0DED8' }}>
              <div>
                <label style={s.label}>카테고리 *</label>
                <input
                  style={s.input}
                  placeholder="Design Thinking"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                />
              </div>
              <div>
                <label style={s.label}>제목 *</label>
                <input
                  style={s.input}
                  placeholder="글 제목"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
            </div>

            {/* 블록 에디터 — 글 등록 후에만 표시 */}
            {selectedInsight ? (
              <>
                <p style={s.sectionLabel}>콘텐츠 블록</p>
                <BlockEditor
                  ref={blockEditorRef}
                  projectId={selectedInsight.id}
                  token={token}
                  apiBase="/api/insights"
                />
              </>
            ) : (
              <div style={{ border:'1.5px dashed #E0DED8', padding:'2.5rem', textAlign:'center', color:'#C8B89A' }}>
                <p style={{ fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.3rem' }}>글 등록 후 콘텐츠를 입력할 수 있어요</p>
              </div>
            )}

            {/* 저장 / 삭제 버튼 — 하단 */}
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'2.5rem', paddingTop:'1.5rem', borderTop:'1px solid #E0DED8' }}>
              <button
                onClick={handleSave} disabled={saving}
                style={{ padding:'0.75rem 2rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity:saving?0.6:1 }}
              >
                {saving ? '저장 중...' : (selectedInsight ? '저장' : '글 등록')}
              </button>
              {selectedInsight && (
                <button onClick={handleDelete}
                  style={{ padding:'0.75rem 1.2rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid #C0392B', cursor:'pointer' }}>
                  삭제
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
