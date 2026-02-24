// app/api/projects/[id]/route.ts
// PUT    /api/projects/:id  — 수정 (인증 필요)
// DELETE /api/projects/:id  — 삭제 (인증 필요)

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const body = await req.json()
  const { title, tag, year, image_url, col_size, sort_order } = body

  const { data, error } = await supabase
    .from('projects')
    .update({ title, tag, year, image_url, col_size, sort_order })
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
    .from('projects')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: '삭제 완료' })
}
