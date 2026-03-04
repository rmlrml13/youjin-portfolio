// app/api/insights/route.ts
// GET  /api/insights  — 전체 조회 (public)
// POST /api/insights  — 추가 (인증 필요)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: false })

  if (error) {
    console.warn('Supabase 오류:', error.message)
    return NextResponse.json([])
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const authError = verifyToken(req)
  if (authError) return authError

  const body = await req.json()
  const { category, title, sort_order, content_html, thumbnail_url } = body

  if (!category || !title) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('insights')
    .insert([{ category, title, sort_order: sort_order ?? 0, content_html: content_html ?? '', thumbnail_url: thumbnail_url ?? '' }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
