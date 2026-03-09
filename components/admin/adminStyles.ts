// components/admin/adminStyles.ts
// 어드민 공통 스타일 + 유틸 함수

export function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export const COLORS = {
  bg:         '#F7F5F0',
  surface:    '#FAFAF8',
  border:     '#D0CEC8',
  borderMid:  '#C0BEB8',
  hover:      '#F0EEE8',
  active:     '#E8E6E0',
  ink:        '#1A1A18',
  inkMid:     '#555',
  inkLight:   '#888',
  inkFaint:   '#aaa',
  gold:       '#C8A96E',
  goldLight:  '#E8D5B0',
  red:        '#C0392B',
  redLight:   '#FDECEA',
  accent:     '#C8A96E',
}

export const s: Record<string, React.CSSProperties> = {
  metaChip:      { display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'11px', color: COLORS.inkMid, fontFamily:'DM Mono, monospace', letterSpacing:'0.04em' },
  metaChipLabel: { fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color: COLORS.inkFaint },
  sectionLabel:  { fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color: COLORS.inkFaint, fontWeight:700, marginBottom:'0.6rem', display:'block', fontFamily:'DM Mono, monospace' },
  label:         { display:'block', fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color: COLORS.inkFaint, marginBottom:'0.5rem', marginTop:'0', fontWeight:700, fontFamily:'DM Mono, monospace' },
  input:         { width:'100%', padding:'0.65rem 0.9rem', border:`1px solid ${COLORS.border}`, background:'#fff', fontFamily:'DM Mono, monospace', fontSize:'13px', color: COLORS.ink, outline:'none', boxSizing:'border-box' as const, borderRadius: 2 },
}
