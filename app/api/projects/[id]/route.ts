// app/api/projects/[id]/route.ts
// PUT    /api/projects/:id  — 수정 (인증 필요, 이미지 재업로드 포함)
// DELETE /api/projects/:id  — 삭제 (인증 필요)

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const formData   = await req.formData()
  const title      = formData.get('title') as string
  const tag        = formData.get('tag') as string
  const year       = formData.get('year') as string
  const col_size   = formData.get('col_size') as string
  const sort_order = Number(formData.get('sort_order') || 0)
  const imageFile  = formData.get('image') as File | null

  // 기존 프로젝트 조회
  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
  }

  // 새 이미지가 있으면 업로드
  let image_url = existing.image_url
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

    // 기존 이미지 Storage에서 삭제 (Supabase URL인 경우만)
    if (existing.image_url?.includes('portfolio-images')) {
      // 폴더명 포함한 정확한 경로 추출 (folder/filename.ext)
      const match = existing.image_url.match(/portfolio-images\/(.+)$/)
      const oldPath = match?.[1]
      if (oldPath) {
        await supabase.storage.from('portfolio-images').remove([oldPath])
      }
    }
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      title:      title      || existing.title,
      tag:        tag        || existing.tag,
      year:       year       || existing.year,
      image_url,
      col_size:   col_size   || existing.col_size,
      sort_order: sort_order ?? existing.sort_order,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  // 삭제 전 이미지 URL 가져오기
  const { data: existing } = await supabase
    .from('projects')
    .select('image_url')
    .eq('id', params.id)
    .single()

  // Storage 이미지도 함께 삭제
  if (existing?.image_url?.includes('portfolio-images')) {
    const match = existing.image_url.match(/portfolio-images\/(.+)$/)
    const oldPath = match?.[1]
    if (oldPath) {
      await supabase.storage.from('portfolio-images').remove([oldPath])
    }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: '삭제 완료' })
}
