// lib/config.ts
import { DEFAULT_CONFIG, SiteConfig } from '@/lib/types'

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return DEFAULT_CONFIG

    // fetch로 직접 호출 — Next.js 캐시를 완전히 우회
    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_config?select=key,value`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) return DEFAULT_CONFIG

    const data: { key: string; value: string }[] = await res.json()

    const config = data.reduce((acc, row) => {
      acc[row.key] = row.value
      return acc
    }, {} as Record<string, string>)

    return { ...DEFAULT_CONFIG, ...config } as SiteConfig
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getSiteConfig] Supabase 연결 실패, DEFAULT_CONFIG 사용:', err)
    }
    return DEFAULT_CONFIG
  }
}
