'use client'
// components/admin/InsightEditor.tsx
import { useState } from 'react'
import type { Insight } from '@/lib/types'
import { s } from './adminStyles'

interface InsightForm {
  category: string
  title: string
  description: string
  date: string
  read_time: string
  sort_order: number
}

interface Props {
  selectedInsight: Insight | null
  isCreating: boolean
  token: string
  onSaved: () => void
  onDeleted: () => void
}

function toForm(ins: Insight | null): InsightForm {
  if (!ins) return { category:'', title:'', description:'', date:'', read_time:'', sort_order:0 }
  return { category:ins.category, title:ins.title, description:ins.description, date:ins.date, read_time:ins.read_time, sort_order:ins.sort_order }
}

export default function InsightEditor({ selectedInsight, isCreating, token, onSaved, onDeleted }: Props) {
  // key prop으로 리마운트되므로 초기값 한 번만 세팅
  const [form,   setForm]   = useState<InsightForm>(() => toForm(selectedInsight))
  const [saving, setSaving] = useState(false)

  const showEmpty = !selectedInsight && !isCreating

  async function handleSave() {
    if (!form.category || !form.title || !form.description || !form.date) {
      alert('카테고리, 제목, 설명, 날짜는 필수입니다.'); return
    }
    setSaving(true)
    const isEdit = !!selectedInsight
    const res = await fetch(
      isEdit ? `/api/insights/${selectedInsight!.id}` : '/api/insights',
      { method: isEdit ? 'PUT' : 'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(form) }
    )
    setSaving(false)
    if (res.ok) { onSaved() }
    else { const e = await res.json(); alert('오류: ' + e.error) }
  }

  async function handleDelete() {
    if (!selectedInsight || !confirm(`"${selectedInsight.title}" 항목을 삭제할까요?`)) return
    await fetch(`/api/insights/${selectedInsight.id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    onDeleted()
  }

  return (
    <>
      {/* 헤더 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E0DED8', padding:'1rem 2rem', flexShrink:0 }}>
        <p style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#C8B89A', marginBottom:'0.2rem' }}>
          {selectedInsight ? `Insight #${selectedInsight.id}` : '새 글'}
        </p>
        <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.15rem', color:'#1A1A18' }}>
          {selectedInsight ? (form.title || '—') : 'New Insight'}
        </h2>
      </div>

      {/* 본문 */}
      <div style={{ flex:1, overflowY:'auto', padding:'2.5rem 2rem' }}>

        {/* 빈 상태 */}
        {showEmpty && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#C8B89A' }}>
            <p style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.3rem', marginBottom:'0.5rem', color:'#888880' }}>글을 선택하거나</p>
            <p style={{ fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase' }}>새로 만들기를 눌러주세요</p>
          </div>
        )}

        {/* 폼 */}
        {!showEmpty && (
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {([
                { label:'카테고리 *', key:'category',  placeholder:'Design Thinking', span:1 },
                { label:'날짜 *',     key:'date',       placeholder:'2025.01',         span:1 },
                { label:'제목 *',     key:'title',      placeholder:'글 제목',         span:2 },
                { label:'읽기 시간',  key:'read_time',  placeholder:'5 min read',      span:1 },
                { label:'정렬 순서',  key:'sort_order', placeholder:'0',               span:1 },
              ] as { label:string; key:keyof InsightForm; placeholder:string; span:number }[]).map(f => (
                <div key={f.key} style={{ gridColumn:`span ${f.span}` }}>
                  <label style={s.label}>{f.label}</label>
                  <input
                    style={s.input}
                    placeholder={f.placeholder}
                    value={String(form[f.key])}
                    onChange={e => setForm(p => ({ ...p, [f.key]: f.key === 'sort_order' ? Number(e.target.value) : e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ gridColumn:'span 2' }}>
                <label style={s.label}>설명 *</label>
                <textarea
                  style={{ ...s.input, height:'140px', resize:'vertical' as const }}
                  placeholder="카드에 표시되는 요약 설명"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.5rem', marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid #E0DED8' }}>
              <button
                onClick={handleSave} disabled={saving}
                style={{ padding:'0.75rem 2rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'none', cursor:'pointer', opacity:saving?0.6:1 }}
              >
                {saving ? '저장 중...' : (selectedInsight ? '저장' : '추가')}
              </button>
              {selectedInsight && (
                <button
                  onClick={handleDelete}
                  style={{ padding:'0.75rem 1.2rem', background:'transparent', color:'#C0392B', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid #C0392B', cursor:'pointer' }}
                >
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
