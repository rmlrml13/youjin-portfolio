// app/api/projects/[id]/images/route.ts
// GET    /api/projects/:id/images  — 추가 이미지 목록 조회 (public)
// POST   /api/projects/:id/images  — 추가 이미지 업로드 (인증 필요)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('project_images')
    .select('*')
    .eq('project_id', params.id)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) return NextResponse.json([])
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const formData  = await req.formData()
  const imageFile = formData.get('image') as File | null
  const sort_order = Number(formData.get('sort_order') || 0)

  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: '이미지 파일이 없습니다' }, { status: 400 })
  }

  const ext      = imageFile.name.split('.').pop()
  const fileName = `projects/${params.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer   = Buffer.from(await imageFile.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('portfolio-images')
    .upload(fileName, buffer, { contentType: imageFile.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: '업로드 실패: ' + uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('portfolio-images')
    .getPublicUrl(fileName)

  const { data, error } = await supabase
    .from('project_images')
    .insert([{ project_id: Number(params.id), image_url: urlData.publicUrl, sort_order }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
