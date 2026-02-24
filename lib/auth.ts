// lib/auth.ts
// JWT 검증 유틸

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function verifyToken(req: NextRequest): NextResponse | null {
  const auth  = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  try {
    jwt.verify(token, JWT_SECRET)
    return null // 정상
  } catch {
    return NextResponse.json({ error: '토큰이 만료되었거나 유효하지 않습니다' }, { status: 401 })
  }
}
