// app/api/insights/[id]/blocks/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('insight_blocks')
    .select('*')
    .eq('insight_id', params.id)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) return NextResponse.json([])
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const contentType = req.headers.get('content-type') ?? ''

  // 이미지 블록
  if (contentType.includes('multipart/form-data')) {
    const formData   = await req.formData()
    const imageFile  = formData.get('image') as File | null
    const sort_order = Number(formData.get('sort_order') || 0)

    if (!imageFile || imageFile.size === 0)
      return NextResponse.json({ error: '이미지가 없습니다' }, { status: 400 })

    const ext      = imageFile.name.split('.').pop()
    const fileName = `insights/${params.id}/blocks/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer   = Buffer.from(await imageFile.arrayBuffer())

    const { error: upErr } = await supabase.storage
      .from('portfolio-images')
      .upload(fileName, buffer, { contentType: imageFile.type, upsert: false })

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName)

    const { data, error } = await supabase
      .from('insight_blocks')
      .insert([{ insight_id: Number(params.id), type: 'image', content: '', image_url: urlData.publicUrl, sort_order }])
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  // 텍스트/heading/divider
  const body = await req.json()
  const { type, content, sort_order } = body

  if (!type) return NextResponse.json({ error: 'type 필수' }, { status: 400 })

  const { data, error } = await supabase
    .from('insight_blocks')
    .insert([{ insight_id: Number(params.id), type, content: content ?? '', image_url: '', sort_order: sort_order ?? 0 }])
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
