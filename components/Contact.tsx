// components/Contact.tsx
import type { SiteConfig } from '@/lib/types'

interface Props { config: SiteConfig }

export default function Contact({ config }: Props) {
  const links = [
    { label: config.contact_email, href: `mailto:${config.contact_email}` },
    { label: 'Instagram', href: config.contact_instagram },
    { label: 'Behance',   href: config.contact_behance },
    { label: 'LinkedIn',  href: config.contact_linkedin },
  ]

  return (
    <section id="contact" className="contact-section">
      <div className="contact-left">
        <h2>Let&apos;s work<br /><em>together.</em></h2>
      </div>
      <div className="contact-links">
        {links.map(l => (
          <a key={l.label} href={l.href} target={l.href.startsWith('mailto') ? '_self' : '_blank'} rel="noreferrer">
            {l.label}
          </a>
        ))}
      </div>
    </section>
  )
}
