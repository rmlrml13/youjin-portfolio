// lib/types.ts
export interface Insight {
  id: number
  category: string
  title: string
  sort_order: number
  content_html?: string | null
  thumbnail_url?: string | null
  view_count?: number
  created_at?: string
  updated_at?: string
}

export interface InsightBlock {
  id: number
  insight_id: number
  type: 'heading' | 'text' | 'image' | 'divider'
  content: string
  image_url: string
  sort_order: number
}

export interface Project {
  id: number
  title: string
  tag: string
  year?: string
  image_url: string
  col_size: string
  sort_order: number
  client?: string
  view_count?: number
  created_at?: string
  updated_at?: string
}

export interface ProjectBlock {
  id: number
  project_id: number
  type: 'heading' | 'text' | 'image' | 'divider'
  content: string
  image_url: string
  sort_order: number
  created_at?: string
}

export interface ProjectImage {
  id: number
  project_id: number
  image_url: string
  sort_order: number
  created_at?: string
}

export interface SiteConfig {
  hero_name: string
  hero_subtitle: string
  hero_desc: string       // Hero 섹션 소개 문구
  tagline_desc: string    // Tagline 섹션 부제목 문구 (hero_desc와 분리)
  about_image_url: string // About 이미지
  about_text1: string
  about_text2: string
  about_skills: string    // 콤마 구분 문자열 — 렌더링 시 split(',') 필요
  contact_email: string
  contact_instagram: string
  contact_behance: string
  contact_linkedin: string
  footer_name: string
  footer_region: string
}

export const DEFAULT_CONFIG: SiteConfig = {
  hero_name:         'Youjin',
  hero_subtitle:     'Design & Art Works',
  hero_desc:         'Visual designer crafting thoughtful, considered work at the intersection of art and communication.',
  tagline_desc:      'Design shapes how people feel, think, and connect — every pixel with purpose.',
  about_image_url:   '',
  about_text1:       '안녕하세요. 저는 시각적 커뮤니케이션과 예술의 경계에서 작업하는 디자이너입니다.',
  about_text2:       '각 프로젝트마다 클라이언트의 비전을 명확하고 아름다운 시각 언어로 번역하는 데 집중합니다.',
  about_skills:      'Branding,Editorial,UI Design,Illustration,Typography,Motion,Art Direction',
  contact_email:     'hello@youjin.com',
  contact_instagram: '#',
  contact_behance:   '#',
  contact_linkedin:  '#',
  footer_name:       'Youjin',
  footer_region:     'Seoul, Korea',
}
