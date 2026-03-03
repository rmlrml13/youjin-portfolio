// app/api/projects/[id]/view/route.ts
// POST /api/projects/:id/view — 조회수 +1
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: current } = await supabase
    .from('projects')
    .select('view_count')
    .eq('id', params.id)
    .single()

  const { error } = await supabase
    .from('projects')
    .update({ view_count: (current?.view_count ?? 0) + 1 })
    .eq('id', params.id)

  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}
