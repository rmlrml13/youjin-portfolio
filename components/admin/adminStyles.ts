// components/admin/adminStyles.ts
// 어드민 공통 스타일 + 유틸 함수

export function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

export const s: Record<string, React.CSSProperties> = {
  metaChip:      { display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'11px', color:'#555', fontFamily:'DM Mono, monospace', letterSpacing:'0.04em' },
  metaChipLabel: { fontSize:'9px', letterSpacing:'0.12em', textTransform:'uppercase', color:'#999' },
  sectionLabel:  { fontSize:'10px', letterSpacing:'0.16em', textTransform:'uppercase', color:'#333', fontWeight: 600, marginBottom:'0.75rem', display:'block' },
  label:         { display:'block', fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', color:'#444', marginBottom:'0.4rem', marginTop:'0.4rem', fontWeight: 500 },
  input:         { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #C8C6C0', background:'#fff', fontFamily:'DM Mono, monospace', fontSize:'13px', color:'#1A1A18', outline:'none', boxSizing:'border-box' as const },
}
