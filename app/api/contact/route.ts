// app/api/contact/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { buildNotifyHtml, buildAutoReplyHtml, type ContactPayload } from '@/lib/email'

/* ── POST: 문의 접수 ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, project, budget, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // 1) DB 저장
    const { data: inserted, error: dbError } = await supabase
      .from('contact_requests')
      .insert({ name, email, phone, project, budget, message, status: 'new' })
      .select().single()

    if (dbError) {
      console.error('[contact POST] DB error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 2) 이메일 발송 (Resend)
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey && !apiKey.includes('여기에')) {
      const payload: ContactPayload = { name, email, phone, project, budget, message }
      const from    = process.env.RESEND_FROM   ?? 'onboarding@resend.dev'
      const toOwner = process.env.NOTIFY_EMAIL  ?? email

      await Promise.allSettled([
        // 운영자 알림
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            from,
            to:      [toOwner],
            subject: `[상담 문의] ${name}님 — ${project || '프로젝트 미정'}`,
            html:    buildNotifyHtml(payload),
          }),
        }),
        // 문의자 자동 회신
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            from,
            to:      [email],
            subject: '문의가 접수되었습니다 — Youjin',
            html:    buildAutoReplyHtml(payload),
          }),
        }),
      ])
    }

    return NextResponse.json({ message: '접수 완료', id: inserted?.id })
  } catch (e) {
    console.error('[contact POST]', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/* ── GET: 문의 목록 (어드민용) ── */
export async function GET(req: NextRequest) {
  const authError = verifyToken(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'new' | 'read' | 'done' | null(전체)

  let query = supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
