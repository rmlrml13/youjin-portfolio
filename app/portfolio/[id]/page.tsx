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
    <>
      <Header name={config.hero_name} />
      <ViewTracker projectId={project.id} />

      {/* ── 히어로 ── */}
      <div className="pd-hero">
        {project.image_url
          ? <Image src={project.image_url} alt={project.title} fill priority style={{ objectFit:'cover' }} />
          : <div className="pd-hero-placeholder" />
        }
        <div className="pd-hero-overlay" />
        <div className="pd-hero-meta">
          <div />
          <div className="pd-hero-info">
            <h1 className="pd-title">{project.title}</h1>
            {project.description && (
              <p className="pd-hero-desc">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 프로젝트 메타 정보 ── */}
      <section className="pd-info-section">
        <div className="pd-info-inner">
          {/* 메타 항목 — 좌: Category / 우: Date · Views */}
          <div className="pd-meta-row">
            <div className="pd-meta-item">
              <span className="pd-info-label">Category</span>
              <span className="pd-info-value">{project.tag}</span>
            </div>
            <div style={{ flex:1 }} />
            <div className="pd-meta-item" style={{ alignItems:'flex-end' }}>
              <span className="pd-info-label">Date</span>
              <span className="pd-info-value">{fmtDate(project.created_at)}</span>
            </div>
            <div className="pd-meta-divider" />
            <div className="pd-meta-item" style={{ alignItems:'flex-end' }}>
              <span className="pd-info-label">Views</span>
              <span className="pd-info-value">{(project.view_count ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </section>

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

      <Footer config={config} />
    </>
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
  switch (block.type) {
    case 'heading':
      return (
        <div className="pd-block pd-block-heading">
          <h2 className="pd-block-h">{block.content}</h2>
        </div>
      )
    case 'text':
      return (
        <div className="pd-block pd-block-text">
          {block.content.split('\n').map((line, i) =>
            line.trim()
              ? <p key={i} className="pd-block-p">{line}</p>
              : <br key={i} />
          )}
        </div>
      )
    case 'image':
      return (
        <div className="pd-block pd-block-image">
          <div className="pd-block-img-wrap">
            <Image
              src={block.image_url}
              alt={title}
              fill
              style={{ objectFit:'cover' }}
            />
          </div>
        </div>
      )
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
