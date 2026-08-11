export function EditorialGrid() {
  return (
    <div aria-hidden="true" className="editorial-grid">
      <span className="editorial-grid__line editorial-grid__line--vertical" />
      <span className="editorial-grid__line editorial-grid__line--horizontal" />
      <span className="editorial-grid__marker editorial-grid__marker--red" />
      <span className="editorial-grid__marker editorial-grid__marker--yellow" />
      <span className="editorial-grid__marker editorial-grid__marker--green" />
      <span className="editorial-grid__marker editorial-grid__marker--blue" />
    </div>
  )
}
