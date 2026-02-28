// app/api/auth/route.ts
// POST /api/auth  — 관리자 로그인
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET       = process.env.JWT_SECRET       || 'dev-secret'
const ADMIN_USERNAME   = process.env.ADMIN_USERNAME   || 'admin'
const ADMIN_PASSWORD   = process.env.ADMIN_PASSWORD   || 'admin1234'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다' }, { status: 401 })
  }

  // 환경변수 비밀번호가 bcrypt 해시인지 plain text인지 자동 판별
  const isHashed = ADMIN_PASSWORD.startsWith('$2')
  const isValid  = isHashed
    ? await bcrypt.compare(password, ADMIN_PASSWORD)
    : password === ADMIN_PASSWORD

  if (!isValid) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다' }, { status: 401 })
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' })
  return NextResponse.json({ token })
}
