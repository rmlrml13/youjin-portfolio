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
