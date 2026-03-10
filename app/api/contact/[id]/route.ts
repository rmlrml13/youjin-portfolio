// app/api/contact/[id]/route.ts
// PATCH /api/contact/:id — 상태 변경 (new → read → done)
// DELETE /api/contact/:id — 삭제
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const { status, memo } = await req.json()

  const { data, error } = await supabase
    .from('contact_requests')
    .update({
      ...(status !== undefined && { status }),
      ...(memo   !== undefined && { memo }),
    })
    .eq('id', params.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = verifyToken(req)
  if (authError) return authError

  const { error } = await supabase
    .from('contact_requests')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
