'use client'
// components/admin/ContactManager.tsx
import { useState, useEffect, useCallback } from 'react'
import { COLORS, fmtDate } from './adminStyles'

type Status = 'new' | 'read' | 'done'

interface ContactRequest {
  id: number
  name: string
  email: string
  phone?: string
  project?: string
  budget?: string
  message: string
  status: Status
  memo?: string
  created_at: string
}

const STATUS_LABEL: Record<Status, string> = { new: '신규', read: '확인', done: '완료' }
const STATUS_COLOR: Record<Status, { bg: string; color: string; border: string }> = {
  new:  { bg: '#FFF3EC', color: '#C0392B', border: '#F5C6B8' },
  read: { bg: '#FFF9EC', color: '#B8860B', border: '#F0D890' },
  done: { bg: '#EDF7F0', color: '#27783A', border: '#A8D8B5' },
}

interface Props {
  token: string
  onNewCountChange?: (count: number) => void
  onSessionExpired?: () => void
}

export default function ContactManager({ token, onNewCountChange, onSessionExpired }: Props) {
  const [requests,  setRequests]  = useState<ContactRequest[]>([])
  const [selected,  setSelected]  = useState<ContactRequest | null>(null)
  const [filter,    setFilter]    = useState<Status | 'all'>('all')
  const [loading,   setLoading]   = useState(true)
  const [memo,      setMemo]      = useState('')
  const [savingMemo, setSavingMemo] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const url = filter === 'all' ? '/api/contact' : `/api/contact?status=${filter}`
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 401) { onSessionExpired?.(); return }
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setRequests(list)
    setLoading(false)
    // 전체 조회 시 신규 카운트 갱신
    if (filter === 'all') {
      onNewCountChange?.(list.filter((r: ContactRequest) => r.status === 'new').length)
    }
  }, [token, filter, onNewCountChange])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // 문의 선택 시 자동으로 read 처리
  async function handleSelect(req: ContactRequest) {
    setSelected(req)
    setMemo(req.memo ?? '')
    if (req.status === 'new') {
      await fetch(`/api/contact/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'read' }),
      })
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'read' } : r))
      setSelected(prev => prev ? { ...prev, status: 'read' } : prev)
    }
  }

  async function handleStatusChange(status: Status) {
    if (!selected) return
    await fetch(`/api/contact/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    const updated = requests.map(r => r.id === selected.id ? { ...r, status } : r)
    setRequests(updated)
    setSelected(prev => prev ? { ...prev, status } : prev)
    onNewCountChange?.(updated.filter(r => r.status === 'new').length)
  }

  async function handleSaveMemo() {
    if (!selected) return
    setSavingMemo(true)
    await fetch(`/api/contact/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ memo }),
    })
    setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, memo } : r))
    setSelected(prev => prev ? { ...prev, memo } : prev)
    setSavingMemo(false)
  }

  async function handleDelete() {
    if (!selected || !confirm(`"${selected.name}"님의 문의를 삭제할까요?`)) return
    await fetch(`/api/contact/${selected.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setRequests(prev => prev.filter(r => r.id !== selected.id))
    setSelected(null)
  }

  const counts = {
    all:  requests.length,
    new:  requests.filter(r => r.status === 'new').length,
    read: requests.filter(r => r.status === 'read').length,
    done: requests.filter(r => r.status === 'done').length,
  }

  // filter 적용은 API에서 처리, 목록은 그대로 사용
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── 좌측 목록 ── */}
      <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', background: '#fff' }}>

        {/* 필터 탭 */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['all', 'new', 'read', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.7rem',
                background: filter === f ? COLORS.ink : 'transparent',
                color: filter === f ? '#fff' : COLORS.inkMid,
                border: `1px solid ${filter === f ? COLORS.ink : COLORS.border}`,
                borderRadius: 100,
                fontFamily: 'DM Mono, monospace', fontSize: '10px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
              {f === 'all' ? '전체' : STATUS_LABEL[f]}
              <span style={{
                fontSize: '9px', padding: '0 4px',
                background: filter === f ? 'rgba(255,255,255,0.2)' : COLORS.hover,
                borderRadius: 100, minWidth: 14, textAlign: 'center',
              }}>{f === 'all' ? counts.all : counts[f]}</span>
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.inkFaint, fontSize: '11px' }}>불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.inkFaint, fontSize: '11px' }}>문의가 없습니다</div>
          ) : filtered.map(req => (
            <div key={req.id} onClick={() => handleSelect(req)}
              style={{
                padding: '0.9rem 1.1rem',
                borderBottom: `1px solid ${COLORS.border}`,
                cursor: 'pointer',
                background: selected?.id === req.id ? COLORS.bg : '#fff',
                borderLeft: `3px solid ${selected?.id === req.id ? COLORS.ink : 'transparent'}`,
                transition: 'background 0.1s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {req.status === 'new' && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.red, flexShrink: 0, display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: '13px', fontFamily: 'DM Serif Display, serif', color: COLORS.ink }}>{req.name}</span>
                </div>
                <span style={{
                  fontSize: '9px', padding: '2px 7px',
                  background: STATUS_COLOR[req.status].bg,
                  color: STATUS_COLOR[req.status].color,
                  border: `1px solid ${STATUS_COLOR[req.status].border}`,
                  borderRadius: 100, letterSpacing: '0.06em',
                  fontFamily: 'DM Mono, monospace', flexShrink: 0,
                }}>{STATUS_LABEL[req.status]}</span>
              </div>
              <p style={{ fontSize: '11px', color: COLORS.inkMid, margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {req.project || req.email}
              </p>
              <p style={{ fontSize: '10px', color: COLORS.inkFaint, margin: 0, fontFamily: 'DM Mono, monospace' }}>
                {fmtDate(req.created_at)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 우측 상세 ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
            <div style={{ fontSize: '2rem', opacity: 0.2 }}>✉</div>
            <p style={{ fontSize: '11px', color: COLORS.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>문의를 선택해주세요</p>
          </div>
        ) : (
          <div style={{ maxWidth: 640, padding: '2rem 2.5rem 4rem' }}>

            {/* 상단 메타 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
              <div>
                <p style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkFaint, marginBottom: '0.3rem', fontFamily: 'DM Mono, monospace' }}>
                  Contact #{selected.id} · {fmtDate(selected.created_at)}
                </p>
                <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: COLORS.ink, margin: 0 }}>
                  {selected.name}
                </h2>
              </div>

              {/* 상태 변경 버튼 */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['new', 'read', 'done'] as Status[]).map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: selected.status === s ? STATUS_COLOR[s].bg : 'transparent',
                      color: selected.status === s ? STATUS_COLOR[s].color : COLORS.inkMid,
                      border: `1px solid ${selected.status === s ? STATUS_COLOR[s].border : COLORS.border}`,
                      borderRadius: 100, fontFamily: 'DM Mono, monospace',
                      fontSize: '10px', letterSpacing: '0.08em',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>{STATUS_LABEL[s]}</button>
                ))}
              </div>
            </div>

            {/* 정보 칩 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: '이메일', value: selected.email, href: `mailto:${selected.email}` },
                { label: '연락처', value: selected.phone },
                { label: '프로젝트', value: selected.project },
                { label: '예산', value: selected.budget },
              ].map(item => item.value ? (
                <div key={item.label} style={{ background: '#fff', border: `1px solid ${COLORS.border}`, padding: '0.75rem 1rem', borderRadius: 3 }}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.inkFaint, margin: '0 0 0.3rem', fontFamily: 'DM Mono, monospace' }}>{item.label}</p>
                  {item.href
                    ? <a href={item.href} style={{ fontSize: '13px', color: COLORS.gold, textDecoration: 'none', fontFamily: 'DM Mono, monospace' }}>{item.value}</a>
                    : <p style={{ fontSize: '13px', color: COLORS.ink, margin: 0 }}>{item.value}</p>
                  }
                </div>
              ) : null)}
            </div>

            {/* 문의 내용 */}
            <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, padding: '1.25rem', marginBottom: '1.25rem', borderRadius: 3 }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.inkFaint, margin: '0 0 0.75rem', fontFamily: 'DM Mono, monospace' }}>문의 내용</p>
              <p style={{ fontSize: '14px', color: COLORS.ink, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
            </div>

            {/* 메모 */}
            <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, padding: '1.25rem', marginBottom: '1.5rem', borderRadius: 3 }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.inkFaint, margin: '0 0 0.75rem', fontFamily: 'DM Mono, monospace' }}>내부 메모</p>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="처리 내용, 회신 여부 등을 기록하세요..."
                rows={4}
                style={{
                  width: '100%', border: `1px solid ${COLORS.border}`,
                  padding: '0.65rem 0.85rem', fontSize: '13px',
                  fontFamily: 'DM Mono, monospace', color: COLORS.ink,
                  background: COLORS.bg, resize: 'vertical', outline: 'none',
                  lineHeight: 1.7, boxSizing: 'border-box', borderRadius: 2,
                }}
              />
              <button onClick={handleSaveMemo} disabled={savingMemo}
                style={{
                  marginTop: '0.5rem', padding: '0.45rem 1.2rem',
                  background: COLORS.ink, color: '#fff', border: 'none',
                  fontFamily: 'DM Mono, monospace', fontSize: '10px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', borderRadius: 2, opacity: savingMemo ? 0.6 : 1,
                }}>
                {savingMemo ? '저장 중...' : '메모 저장'}
              </button>
            </div>

            {/* 액션 */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href={`mailto:${selected.email}?subject=Re: 상담 문의 회신`}
                style={{
                  padding: '0.65rem 1.75rem', background: COLORS.ink, color: '#fff',
                  textDecoration: 'none', fontFamily: 'DM Mono, monospace',
                  fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  borderRadius: 2,
                }}>
                ✉ 답장하기
              </a>
              <button onClick={handleDelete}
                style={{
                  padding: '0.65rem 1.2rem', background: 'transparent',
                  color: COLORS.red, border: `1px solid ${COLORS.red}`,
                  fontFamily: 'DM Mono, monospace', fontSize: '11px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', borderRadius: 2, opacity: 0.75,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
              >삭제</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
