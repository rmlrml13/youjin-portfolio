// components/About.tsx
const SKILLS = ['Branding','Editorial','UI Design','Illustration','Typography','Motion','Art Direction']

export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-label">About</div>
      <div className="about-content">
        <h2>Designing with<br /><em>intention &amp; care</em></h2>
        <p>안녕하세요. 저는 시각적 커뮤니케이션과 예술의 경계에서 작업하는 디자이너입니다. 브랜딩, 에디토리얼, 디지털 인터페이스 등 다양한 분야에 걸쳐 작업하고 있습니다.</p>
        <p>각 프로젝트마다 클라이언트의 비전을 명확하고 아름다운 시각 언어로 번역하는 데 집중합니다.</p>
        <div className="skills-row">
          {SKILLS.map(s => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      </div>
    </section>
  )
}
