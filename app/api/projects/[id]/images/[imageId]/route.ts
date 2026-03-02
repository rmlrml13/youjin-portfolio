// app/api/projects/[id]/images/[imageId]/route.ts
// DELETE /api/projects/:id/images/:imageId  — 이미지 삭제 (인증 필요)
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  const authError = verifyToken(req)
  if (authError) return authError

  // 이미지 URL 가져오기
  const { data: existing } = await supabase
    .from('project_images')
    .select('image_url')
    .eq('id', params.imageId)
    .eq('project_id', params.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 })
  }

  // Storage에서 삭제
  if (existing.image_url?.includes('portfolio-images')) {
    const match = existing.image_url.match(/portfolio-images\/(.+)$/)
    const filePath = match?.[1]
    if (filePath) {
      await supabase.storage.from('portfolio-images').remove([filePath])
    }
  }

  const { error } = await supabase
    .from('project_images')
    .delete()
    .eq('id', params.imageId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: '삭제 완료' })
}
