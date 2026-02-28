// app/api/projects/route.ts
// GET  /api/projects  — 전체 조회 (public)
// POST /api/projects  — 추가 (인증 필요, 이미지 업로드 포함)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.warn('Supabase 오류:', error.message)
    return NextResponse.json([])
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const authError = verifyToken(req)
  if (authError) return authError

  const formData  = await req.formData()
  const title     = formData.get('title') as string
  const tag       = formData.get('tag') as string
  const year      = formData.get('year') as string
  const col_size  = (formData.get('col_size') as string) || 'col-6'
  const sort_order = Number(formData.get('sort_order') || 0)
  const imageFile = formData.get('image') as File | null

  if (!title || !tag || !year) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
  }

  // 이미지 업로드 (파일이 있을 경우)
  let image_url = ''
  if (imageFile && imageFile.size > 0) {
    const ext      = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer   = Buffer.from(await imageFile.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('portfolio-images')
      .upload(fileName, buffer, { contentType: imageFile.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: '이미지 업로드 실패: ' + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(fileName)

    image_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([{ title, tag, year, image_url, col_size, sort_order }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
