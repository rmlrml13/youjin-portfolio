// lib/supabase.ts
// Supabase 연동 준비 파일
// .env.local에 SUPABASE_URL과 ANON_KEY를 설정하면 자동으로 연결됩니다

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Supabase 테이블 SQL (프로젝트 설정 후 Supabase SQL Editor에서 실행) ───
//
// create table projects (
//   id         bigint generated always as identity primary key,
//   title      text not null,
//   tag        text not null,
//   year       text not null,
//   image_url  text default '',
//   col_size   text default 'col-6',
//   sort_order integer default 0,
//   created_at timestamptz default now()
// );
//
// -- Storage bucket 생성 (Supabase 대시보드 > Storage > New Bucket)
// -- Bucket 이름: portfolio-images, Public: true
