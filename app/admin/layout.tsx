// app/admin/layout.tsx
// 관리자 페이지 전용 레이아웃 — 커스텀 커서 비활성화
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { cursor: auto !important; }
        .cursor { display: none !important; }
      `}</style>
      {children}
    </>
  )
}
