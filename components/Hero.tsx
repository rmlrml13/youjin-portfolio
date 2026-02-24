// components/Hero.tsx
export default function Hero() {
  return (
    <>
      <section className="hero site-wrapper">
        <div className="hero-left">
          <p className="hero-index">— Portfolio 2025</p>
          <h1 className="hero-title">
            Design<br /><em>&amp; Art</em><br />Works
          </h1>
        </div>
        <div className="hero-right">
          <p className="hero-desc">
            Visual designer crafting thoughtful, considered work at the intersection of art and communication.
          </p>
          <a href="#works" className="hero-cta">View selected works</a>
        </div>
      </section>
      <div className="info-strip">
        <span>Seoul, KR — Available for projects</span>
        <span className="scroll-label">Scroll to explore</span>
      </div>
    </>
  )
}
