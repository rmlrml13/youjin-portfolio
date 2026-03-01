'use client'
// components/Header.tsx
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface Props { name: string }

export default function Header({ name }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const isPortfolio = pathname === '/portfolio'
  const isInsight   = pathname === '/insight'
  const isAbout     = pathname === '/about'

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <Link className="logo" href="/" onClick={close}>{name}</Link>

        <nav className="site-nav desktop-nav">
          <Link href="/portfolio" className={isPortfolio ? 'nav-active' : ''}>Portfolio</Link>
          <Link href="/insight"   className={isInsight   ? 'nav-active' : ''}>Insight</Link>
          <Link href="/about"     className={isAbout     ? 'nav-active' : ''}>About</Link>
          <Link href="/about#contact" className="nav-cta">상담신청</Link>
        </nav>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(m => !m)}
          aria-label="메뉴"
        >
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-menu" onClick={close}>
          <Link href="/portfolio" onClick={close}>Portfolio</Link>
          <Link href="/insight"   onClick={close}>Insight</Link>
          <Link href="/about"     onClick={close}>About</Link>
          <Link href="/about#contact" className="mobile-cta" onClick={close}>상담신청</Link>
        </div>
      )}
    </>
  )
}
