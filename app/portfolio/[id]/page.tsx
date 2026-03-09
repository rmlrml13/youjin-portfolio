// app/portfolio/[id]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import { getSiteConfig } from '@/lib/config'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectBlock } from '@/lib/types'
import ViewTracker from '@/components/portfolio/ViewTracker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects').select('*').eq('id', id).single()
  if (error || !data) return null
  return data
}

async function getBlocks(id: string): Promise<ProjectBlock[]> {
  const { data } = await supabase
    .from('project_blocks').select('*').eq('project_id', id)
    .order('sort_order', { ascending: true }).order('id', { ascending: true })
  return data ?? []
}

async function getAdjacentProjects(currentId: number) {
  const { data } = await supabase
    .from('projects').select('id, title, tag')
    .order('sort_order', { ascending: true }).order('id', { ascending: true })
  if (!data) return { prev: null, next: null }
  const idx = data.findIndex(p => p.id === currentId)
  return {
    prev: idx > 0               ? data[idx - 1] : null,
    next: idx < data.length - 1 ? data[idx + 1] : null,
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  if (!project) return { title: 'Not Found' }
  const config  = await getSiteConfig()
  return { title: `${project.title} — ${config.hero_name}` }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, blocks, config] = await Promise.all([
    getProject(params.id),
    getBlocks(params.id),
    getSiteConfig(),
  ])
  if (!project) notFound()

  const { prev, next } = await getAdjacentProjects(project.id)

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Header name={config.hero_name} />
      <ViewTracker projectId={project.id} />

      {/* ── 히어로 ── */}
      <div className="pd-hero">
        {(config.portfolio_hero_image_url || project.image_url)
          ? <Image src={config.portfolio_hero_image_url || project.image_url} alt={project.title} fill priority style={{ objectFit:'cover' }} />
          : <div className="pd-hero-placeholder" />
        }
        <div className="pd-hero-overlay" />
        <div className="pd-hero-meta">
          <div />
          <div className="pd-hero-info">
            <h1 className="pd-title">{project.title}</h1>
          </div>
        </div>
      </div>

      {/* ── 메타 바 ── */}
      <div className="pd-meta-bar">
        <div className="pd-meta-bar-inner">
          <span className="pd-meta-bar-item">{project.tag}</span>
          <span className="pd-meta-bar-dot">·</span>
          <span className="pd-meta-bar-item">{fmtDate(project.created_at)}</span>
          <span className="pd-meta-bar-dot">·</span>
          <span className="pd-meta-bar-item">Views {(project.view_count ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* ── 블록 콘텐츠 ── */}
      {blocks.length > 0 && (
        <article className="pd-blocks">
          {blocks.map(block => (
            <BlockRenderer key={block.id} block={block} title={project.title} />
          ))}
        </article>
      )}

      {/* ── 이전 / 다음 ── */}
      <nav className="pd-nav">
        <div className="pd-nav-inner">
          {prev
            ? <Link href={`/portfolio/${prev.id}`} className="pd-nav-item pd-nav-prev">
                <span className="pd-nav-label">← Previous</span>
                <span className="pd-nav-title">{prev.title}</span>
              </Link>
            : <div />
          }
          <Link href="/portfolio" className="pd-nav-all">Back List</Link>
          {next
            ? <Link href={`/portfolio/${next.id}`} className="pd-nav-item pd-nav-next">
                <span className="pd-nav-label">Next →</span>
                <span className="pd-nav-title">{next.title}</span>
              </Link>
            : <div />
          }
        </div>
      </nav>

      <div style={{ flex:1 }} />
      <Footer config={config} />
    </div>
  )
}

// ── 날짜 포맷 ──
function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

// ── 블록 렌더러 ──
function BlockRenderer({ block, title }: { block: ProjectBlock; title: string }) {
  function getEmbedUrl(url: string): string | null {
    if (!url) return null
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)?([\w-]{11})/)
    const ytFull = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\ w-]{11})/)
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\ w-]{11})/)
    const ytM = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|youtube\.com\/watch\?.*v=)([\w-]{11})/)
    if (ytM) return `https://www.youtube.com/embed/${ytM[1]}?rel=0`
    const vm = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`
    return null
  }

  switch (block.type) {
    case 'heading':
      return (
        <div className="pd-block pd-block-heading">
          <h2
            className="pd-block-h"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        </div>
      )
    case 'text':
      return (
        <div
          className="pd-block pd-block-text"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      )
    case 'image':
      return (
        <div className="pd-block pd-block-image">
          <img
            src={block.image_url}
            alt={title}
            style={{ maxWidth: '100%', display: 'block', height: 'auto' }}
          />
        </div>
      )
    case 'video': {
      const embedUrl = getEmbedUrl(block.content)
      if (!block.content) return null
      return (
        <div className="pd-block pd-block-video">
          <div className="pd-block-video-wrap">
            {embedUrl
              ? <iframe
                  src={embedUrl}
                  style={{ width:'100%', height:'100%', border:'none', display:'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              : <video
                  src={block.content}
                  controls
                  style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }}
                />
            }
          </div>
        </div>
      )
    }
    case 'divider':
      return (
        <div className="pd-block pd-block-divider">
          <hr className="pd-block-hr" />
        </div>
      )
    default:
      return null
  }
}
