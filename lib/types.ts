// lib/types.ts
export interface Project {
  id: number
  title: string
  tag: string
  year: string
  image_url: string
  col_size: string
  sort_order: number
  created_at?: string
}

export interface SiteConfig {
  hero_name: string
  hero_subtitle: string
  hero_desc: string
  hero_image_url: string
  hero_height: string
  about_image_url: string  // About 이미지
  about_text1: string
  about_text2: string
  about_skills: string
  contact_email: string
  contact_instagram: string
  contact_behance: string
  contact_linkedin: string
  footer_name: string
  footer_region: string
}

export const DEFAULT_CONFIG: SiteConfig = {
  hero_name:         'Yujin',
  hero_subtitle:     'Design & Art Works',
  hero_desc:         'Visual designer crafting thoughtful, considered work at the intersection of art and communication.',
  hero_image_url:    '',
  hero_height:       '300px',
  about_image_url:   '',
  about_text1:       '안녕하세요. 저는 시각적 커뮤니케이션과 예술의 경계에서 작업하는 디자이너입니다.',
  about_text2:       '각 프로젝트마다 클라이언트의 비전을 명확하고 아름다운 시각 언어로 번역하는 데 집중합니다.',
  about_skills:      'Branding,Editorial,UI Design,Illustration,Typography,Motion,Art Direction',
  contact_email:     'hello@yujin.com',
  contact_instagram: '#',
  contact_behance:   '#',
  contact_linkedin:  '#',
  footer_name:       'Yujin',
  footer_region:     'Seoul, Korea',
}
