# Yujin Portfolio — Next.js

React + Next.js 14 (App Router) + Supabase 기반 포트폴리오

---

## 시작하기

### 1. 패키지 설치
```bash
cd yujin-next
npm install
```

### 2. 개발 서버 실행 (Supabase 없이도 UI 확인 가능)
```bash
npm run dev
# http://localhost:3000
```

---

## Supabase 연동하기

### 1단계 — Supabase 프로젝트 생성
1. https://supabase.com 접속 → 무료 계정 생성
2. New Project 생성

### 2단계 — 테이블 생성
Supabase 대시보드 > SQL Editor에서 아래 쿼리 실행:

```sql
create table projects (
  id         bigint generated always as identity primary key,
  title      text not null,
  tag        text not null,
  year       text not null,
  image_url  text default '',
  col_size   text default 'col-6',
  sort_order integer default 0,
  created_at timestamptz default now()
);
```

### 3단계 — 환경변수 설정
`.env.local` 파일에 Supabase 정보 입력:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
→ Supabase 대시보드 > Settings > API에서 확인

### 4단계 — 이미지 업로드용 Storage 생성 (선택)
- Supabase 대시보드 > Storage > New Bucket
- 이름: `portfolio-images`, Public: ON

---

## Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

환경변수는 Vercel 대시보드 > Settings > Environment Variables에서 동일하게 입력

---

## 폴더 구조

```
yujin-next/
├── app/
│   ├── page.tsx              ← 메인 포트폴리오
│   ├── layout.tsx
│   ├── globals.css
│   ├── admin/
│   │   └── page.tsx          ← 관리자 CMS
│   └── api/
│       ├── auth/route.ts     ← POST /api/auth (로그인)
│       └── projects/
│           ├── route.ts      ← GET, POST /api/projects
│           └── [id]/route.ts ← PUT, DELETE /api/projects/:id
├── components/
│   ├── Cursor.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── WorksGrid.tsx
│   ├── About.tsx
│   └── Contact.tsx
├── lib/
│   ├── supabase.ts           ← Supabase 클라이언트
│   ├── auth.ts               ← JWT 검증 유틸
│   └── types.ts              ← 타입 정의
└── .env.local                ← 환경변수 (git에 올리지 마세요!)
```

---

## 관리자 계정

| 항목 | 기본값 |
|------|--------|
| URL | /admin |
| 아이디 | admin |
| 비밀번호 | admin1234 |

→ `.env.local`의 `ADMIN_USERNAME`, `ADMIN_PASSWORD`에서 변경 가능
