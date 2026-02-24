// app/page.tsx
import Cursor   from '@/components/Cursor'
import Header   from '@/components/Header'
import Hero     from '@/components/Hero'
import WorksGrid from '@/components/WorksGrid'
import About    from '@/components/About'
import Contact  from '@/components/Contact'

export default function HomePage() {
  return (
    <>
      <Cursor />
      <Header />
      <Hero />
      <WorksGrid />
      <About />
      <Contact />
      <footer className="site-footer">
        <span>© 2025 Yujin. All rights reserved.</span>
        <span>Seoul, Korea</span>
      </footer>
    </>
  )
}
