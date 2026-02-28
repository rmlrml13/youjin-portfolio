'use client'
// components/Header.tsx
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Props { name: string }

export default function Header({ name }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <Link className="logo" href="/" onClick={close}>{name}</Link>

        {/* 데스크탑 네비 */}
        <nav className="site-nav desktop-nav">
          <a href="#works">portfolio</a>
          <a href="#about">insight</a>
          <a href="#contact">about</a>
          <a href="#contact" className="nav-cta">상담신청</a>
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
          <a href="#works" onClick={close}>Works</a>
          <a href="#about" onClick={close}>About</a>
          <a href="#contact" onClick={close}>Contact</a>
          <a href="#contact" className="mobile-cta" onClick={close}>상담신청</a>
        </div>
      )}
    </>
  )
}
