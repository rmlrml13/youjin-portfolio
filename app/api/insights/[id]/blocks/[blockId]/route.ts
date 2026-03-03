// app/api/insights/[id]/blocks/[blockId]/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const authError = verifyToken(req)
  if (authError) return authError

  const body = await req.json()
  const { content, sort_order } = body

  const { data, error } = await supabase
    .from('insight_blocks')
    .update({
      ...(content    !== undefined && { content }),
      ...(sort_order !== undefined && { sort_order }),
    })
    .eq('id', params.blockId)
    .eq('insight_id', params.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const authError = verifyToken(req)
  if (authError) return authError

  const { data: block } = await supabase
    .from('insight_blocks')
    .select('image_url')
    .eq('id', params.blockId)
    .single()

  if (block?.image_url?.includes('portfolio-images')) {
    const match = block.image_url.match(/portfolio-images\/(.+)$/)
    if (match?.[1]) await supabase.storage.from('portfolio-images').remove([match[1]])
  }

  const { error } = await supabase
    .from('insight_blocks')
    .delete()
    .eq('id', params.blockId)
    .eq('insight_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: '삭제 완료' })
}
