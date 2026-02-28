// app/api/upload/route.ts
// POST /api/upload — 이미지를 Supabase Storage에 업로드하고 URL 반환
// Query param: ?folder=hero|about|projects (기본값: general)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const authError = verifyToken(req)
  if (authError) return authError

  const formData  = await req.formData()
  const imageFile = formData.get('image') as File | null
  const folder    = req.nextUrl.searchParams.get('folder') || 'general'

  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: '이미지 파일이 없습니다' }, { status: 400 })
  }

  const ext      = imageFile.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer   = Buffer.from(await imageFile.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('portfolio-images')
    .upload(fileName, buffer, { contentType: imageFile.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: '업로드 실패: ' + uploadError.message }, { status: 500 })
  }

  const { data } = supabase.storage
    .from('portfolio-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: data.publicUrl })
}
