// components/Header.tsx
import Link from 'next/link'

export default function Header() {
  return (
    <header className="site-header">
      <Link className="logo" href="/">Yujin</Link>
      <nav className="site-nav">
        <a href="#works">Works</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}
