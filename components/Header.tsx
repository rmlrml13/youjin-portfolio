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

  // 메뉴 열릴 때 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  // 현재 페이지 여부로 active 스타일
  const isHome      = pathname === '/'
  const isPortfolio = pathname === '/portfolio'
  const isInsight   = pathname === '/insight'

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <Link className="logo" href="/" onClick={close}>{name}</Link>

        {/* 데스크탑 네비 */}
        <nav className="site-nav desktop-nav">
          <Link href="/portfolio" className={isPortfolio ? 'nav-active' : ''}>Portfolio</Link>
          <Link href="/insight"   className={isInsight   ? 'nav-active' : ''}>Insight</Link>
          <a href={isHome ? '#about' : '/#about'}>About</a>
          <a href={isHome ? '#contact' : '/#contact'} className="nav-cta">상담신청</a>
        </nav>

        {/* 햄버거 버튼 (모바일) */}
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

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="mobile-menu" onClick={close}>
          <Link href="/portfolio" onClick={close}>Portfolio</Link>
          <Link href="/insight"   onClick={close}>Insight</Link>
          <a href={isHome ? '#about' : '/#about'} onClick={close}>About</a>
          <a href={isHome ? '#contact' : '/#contact'} className="mobile-cta" onClick={close}>상담신청</a>
        </div>
      )}
    </>
  )
}
