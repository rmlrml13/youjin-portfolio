// lib/config.ts
import { DEFAULT_CONFIG, SiteConfig } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('key, value')

    if (error || !data) return DEFAULT_CONFIG

    const config = (data as { key: string; value: string }[]).reduce((acc, row) => {
      acc[row.key] = row.value
      return acc
    }, {} as Record<string, string>)

    return { ...DEFAULT_CONFIG, ...config } as SiteConfig
  } catch {
    return DEFAULT_CONFIG
  }
}
