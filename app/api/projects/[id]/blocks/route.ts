// app/api/projects/[id]/blocks/route.ts
// GET    /api/projects/:id/blocks — 블록 목록
// POST   /api/projects/:id/blocks — 블록 추가
// DELETE /api/projects/:id/blocks — 텍스트/제목/구분선 블록 일괄 삭제
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('project_blocks')
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

  const contentType = req.headers.get('content-type') ?? ''

  // 이미지 블록: multipart/form-data
  if (contentType.includes('multipart/form-data')) {
    const formData   = await req.formData()
    const mediaFile  = (formData.get('video') ?? formData.get('image')) as File | null
    const blockType  = formData.get('type') as string || 'image'
    const sort_order = Number(formData.get('sort_order') || 0)

    if (!mediaFile || mediaFile.size === 0) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    const ext      = mediaFile.name.split('.').pop()
    const folder   = blockType === 'video' ? 'videos' : 'images'
    const fileName = `projects/${params.id}/blocks/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer   = Buffer.from(await mediaFile.arrayBuffer())

    const { error: upErr } = await supabase.storage
      .from('portfolio-images')
      .upload(fileName, buffer, { contentType: mediaFile.type, upsert: false })

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName)

    const insertData = blockType === 'video'
      ? { project_id: Number(params.id), type: 'video', content: urlData.publicUrl, image_url: '', sort_order }
      : { project_id: Number(params.id), type: 'image', content: '', image_url: urlData.publicUrl, sort_order }

    const { data, error } = await supabase
      .from('project_blocks')
      .insert([insertData])
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  // 텍스트/heading/divider/video(URL) 블록: JSON
  const body = await req.json()
  const { type, content, sort_order } = body

  if (!type) return NextResponse.json({ error: 'type 필수' }, { status: 400 })

  const { data, error } = await supabase
    .from('project_blocks')
    .insert([{ project_id: Number(params.id), type, content: content ?? '', image_url: '', sort_order: sort_order ?? 0 }])
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// 텍스트/제목/구분선 블록 일괄 삭제 (flush 전 호출)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const { error } = await supabase
    .from('project_blocks')
    .delete()
    .eq('project_id', params.id)
    .in('type', ['text', 'heading', 'divider'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
