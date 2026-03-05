// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, project, budget, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contact_requests')
      .insert({ name, email, phone, project, budget, message })

    if (error) {
      console.error('[contact POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '접수 완료' })
  } catch (e) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
