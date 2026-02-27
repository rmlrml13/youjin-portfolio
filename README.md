# Yujin Portfolio

Next.js 14 (App Router) + Supabase 기반 포트폴리오 + 라이브 편집 CMS

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 이미지 스토리지 | Supabase Storage |
| 인증 | JWT (jsonwebtoken) |
| 스타일 | CSS (globals.css) |
| 배포 | Vercel |

---

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 관리자 계정
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin1234

# JWT 시크릿 (배포 전 반드시 변경)
JWT_SECRET=your-secret-key
```

> Supabase 키는 대시보드 > Settings > API에서 확인

### 3. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

---

## Supabase 설정

### 1단계 — 테이블 생성

Supabase 대시보드 > SQL Editor에서 실행:

```sql
-- 프로젝트 테이블
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

-- 사이트 설정 테이블
create table site_config (
  key   text primary key,
  value text default ''
);

-- 기본 설정값 입력
insert into site_config (key, value) values
  ('hero_name',         'Yujin'),
  ('hero_subtitle',     'Design & Art Works'),
  ('hero_desc',         'Visual designer crafting thoughtful, considered work.'),
  ('about_image_url',   ''),
  ('about_text1',       '안녕하세요. 저는 시각적 커뮤니케이션과 예술의 경계에서 작업하는 디자이너입니다.'),
  ('about_text2',       '각 프로젝트마다 클라이언트의 비전을 명확하고 아름다운 시각 언어로 번역하는 데 집중합니다.'),
  ('about_skills',      'Branding,Editorial,UI Design,Illustration,Typography,Motion,Art Direction'),
  ('contact_email',     'hello@yujin.com'),
  ('contact_instagram', '#'),
  ('contact_behance',   '#'),
  ('contact_linkedin',  '#'),
  ('footer_name',       'Yujin'),
  ('footer_region',     'Seoul, Korea');
```

### 2단계 — Storage 버킷 생성

Supabase 대시보드 > Storage > New Bucket

- 이름: `portfolio-images`
- Public: **ON**

### 3단계 — Storage 정책 설정

Supabase 대시보드 > Storage > portfolio-images > Policies:

```sql
-- 공개 읽기 허용
create policy "Public read"
on storage.objects for select
using (bucket_id = 'portfolio-images');

-- 인증된 업로드 허용 (서버에서만 호출되므로 anon 허용)
create policy "Allow upload"
on storage.objects for insert
with check (bucket_id = 'portfolio-images');
```

---

## 관리자 사용법

### 관리자 페이지 (`/admin`)

| 항목 | 기본값 |
|------|--------|
| URL | `/admin` |
| 아이디 | `admin` |
| 비밀번호 | `admin1234` |

> `.env.local`의 `ADMIN_USERNAME`, `ADMIN_PASSWORD`에서 변경 가능  
> `ADMIN_PASSWORD`는 bcrypt 해시값도 지원

**기능:**
- 프로젝트 추가 / 수정 / 삭제
- 프로젝트 이미지 업로드
- 카드 크기 및 정렬 순서 조정

### 라이브 편집 모드

관리자 로그인 후 포트폴리오 페이지(`/`)에 접속하면 상단에 편집 바가 표시됩니다.

1. **✏ 라이브 편집** 버튼 클릭 → 편집 모드 진입
2. 수정할 텍스트 또는 이미지 클릭 → 팝업에서 수정
3. 저장 즉시 화면에 반영

**편집 가능한 항목:**
- Hero 부제목, 소개 문구
- About 이미지, 소개 문단, 스킬 태그
- Contact 이메일, SNS 링크
- Footer 이름, 지역
- 프로젝트 카드 (hover 시 수정 버튼 표시)

---

## 폴더 구조

```
yujin-project/
│
├── app/
│   ├── page.tsx                # 메인 포트폴리오 (서버 컴포넌트)
│   ├── layout.tsx              # 전체 레이아웃 + 폰트
│   ├── globals.css             # 전체 스타일
│   ├── admin/
│   │   └── page.tsx            # 관리자 페이지
│   └── api/
│       ├── auth/route.ts       # POST   /api/auth       로그인
│       ├── config/route.ts     # GET/PUT /api/config    사이트 설정
│       ├── projects/route.ts   # GET/POST /api/projects 프로젝트 목록/추가
│       ├── projects/[id]/      # PUT/DELETE             프로젝트 수정/삭제
│       └── upload/route.ts     # POST   /api/upload     이미지 업로드
│
├── components/
│   ├── Header.tsx              # 네비게이션
│   ├── Hero.tsx                # 메인 상단 텍스트
│   ├── WorksGrid.tsx           # 프로젝트 그리드
│   ├── WorksGridController.tsx # WorksGrid + 편집 연결 브릿지
│   ├── About.tsx               # 소개 섹션
│   ├── Contact.tsx             # 연락처 섹션
│   ├── Cursor.tsx              # 커스텀 커서
│   ├── LiveEditWrapper.tsx     # 라이브 편집 바 + 텍스트/이미지 팝업
│   ├── LiveEditPopup.tsx       # 편집 팝업 UI
│   ├── LiveProjectEditor.tsx   # 프로젝트 편집 이벤트 브릿지
│   └── ProjectEditPanel.tsx    # 프로젝트 수정/추가 슬라이드 패널
│
├── lib/
│   ├── types.ts                # TypeScript 타입 + DEFAULT_CONFIG
│   ├── config.ts               # getSiteConfig() DB 조회
│   ├── supabase.ts             # Supabase 클라이언트
│   └── auth.ts                 # JWT 검증 유틸
│
├── .env.local                  # 환경변수 (git 제외)
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Vercel 배포

```bash
# Vercel CLI로 배포
npx vercel
```

Vercel 대시보드 > Settings > Environment Variables에서 `.env.local`과 동일한 값 입력:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`

> `JWT_SECRET`은 배포 환경에서 추측하기 어려운 긴 랜덤 문자열로 설정하세요.  
> 생성 방법: `openssl rand -base64 32`
