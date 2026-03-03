// app/api/insights/[id]/view/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: current } = await supabase
    .from('insights')
    .select('view_count')
    .eq('id', params.id)
    .single()

  const { error } = await supabase
    .from('insights')
    .update({ view_count: (current?.view_count ?? 0) + 1 })
    .eq('id', params.id)

  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}
