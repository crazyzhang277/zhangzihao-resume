const publicSections = [
  ['hero', 'Profile'],
  ['impact', 'Impact'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['education', 'Education and awards'],
  ['contact', 'Contact'],
] as const

function PublicResume() {
  return (
    <main aria-label="Public resume">
      <header>
        <p className="eyebrow">AIGC resume</p>
        <h1>Zhang Zihao AIGC Resume</h1>
      </header>
      {publicSections.map(([id, title]) => (
        <section aria-labelledby={`${id}-heading`} id={id} key={id}>
          <h2 id={`${id}-heading`}>{title}</h2>
        </section>
      ))}
    </main>
  )
}

function AdminSurface() {
  return (
    <main aria-label="Resume administration">
      <h1>Resume administration</h1>
    </main>
  )
}

export function App() {
  return window.location.pathname.startsWith('/admin') ? <AdminSurface /> : <PublicResume />
}
