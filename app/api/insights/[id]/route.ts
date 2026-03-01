// app/api/insights/[id]/route.ts
// PUT    /api/insights/:id  — 수정 (인증 필요)
// DELETE /api/insights/:id  — 삭제 (인증 필요)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const body = await req.json()
  const { category, title, description, date, read_time, sort_order } = body

  const { data: existing, error: fetchError } = await supabase
    .from('insights')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('insights')
    .update({
      category:   category   ?? existing.category,
      title:      title      ?? existing.title,
      description: description ?? existing.description,
      date:       date       ?? existing.date,
      read_time:  read_time  ?? existing.read_time,
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

  const { error } = await supabase
    .from('insights')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: '삭제 완료' })
}
