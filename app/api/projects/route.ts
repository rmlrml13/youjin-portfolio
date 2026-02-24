// app/api/projects/route.ts
// GET  /api/projects  — 전체 조회 (public)
// POST /api/projects  — 추가 (인증 필요)

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  // Supabase 미연동 시 빈 배열 반환 (URL이 없는 경우)
  if (error) {
    console.warn('Supabase 오류 (미연동 상태일 수 있음):', error.message)
    return NextResponse.json([])
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const authError = verifyToken(req)
  if (authError) return authError

  const body = await req.json()
  const { title, tag, year, image_url, col_size, sort_order } = body

  if (!title || !tag || !year) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([{ title, tag, year, image_url: image_url || '', col_size: col_size || 'col-6', sort_order: sort_order || 0 }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
