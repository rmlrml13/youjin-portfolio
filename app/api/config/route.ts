// app/api/config/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { DEFAULT_CONFIG } from '@/lib/types'

export async function GET() {
  const { data, error } = await supabase
    .from('site_config')
    .select('key, value')

  if (error || !data) return NextResponse.json(DEFAULT_CONFIG)

  const config = data.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {} as Record<string, string>)

  return NextResponse.json({ ...DEFAULT_CONFIG, ...config })
}

export async function PUT(req: NextRequest) {
  const authError = verifyToken(req)
  if (authError) return authError

  const body = await req.json() as Record<string, string>

  // 각 key를 개별 처리:
  // 1) 먼저 행이 있는지 확인
  // 2) 있으면 update, 없으면 insert — 빈 문자열도 확실하게 저장
  const results = await Promise.all(
    Object.entries(body).map(([key, value]) =>
      supabase
        .from('site_config')
        .upsert({ key, value }, { onConflict: 'key' })
    )
  )

  const failed = results.find(r => r.error)
  if (failed?.error) {
    console.error('[config PUT] Supabase error:', failed.error)
    return NextResponse.json({ error: failed.error.message, details: failed.error }, { status: 500 })
  }

  return NextResponse.json({ message: '저장 완료' })
}
