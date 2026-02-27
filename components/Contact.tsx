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
        <a
          href={`mailto:${config.contact_email}`}
          className="editable-field"
          data-edit="contact_email"
          data-label="이메일"
          data-type="text"
          title="클릭하여 수정"
        >
          {config.contact_email}
        </a>
        <a
          href={config.contact_instagram}
          className="editable-field"
          data-edit="contact_instagram"
          data-label="Instagram URL"
          data-type="text"
          title="클릭하여 수정"
          target="_blank" rel="noreferrer"
        >
          Instagram
        </a>
        <a
          href={config.contact_behance}
          className="editable-field"
          data-edit="contact_behance"
          data-label="Behance URL"
          data-type="text"
          title="클릭하여 수정"
          target="_blank" rel="noreferrer"
        >
          Behance
        </a>
        <a
          href={config.contact_linkedin}
          className="editable-field"
          data-edit="contact_linkedin"
          data-label="LinkedIn URL"
          data-type="text"
          title="클릭하여 수정"
          target="_blank" rel="noreferrer"
        >
          LinkedIn
        </a>
      </div>
    </section>
  )
}
