/* Header placeholder shown while Nav resolves. Matches the real header's
   height so the page below doesn't jump when it swaps in. */
export function NavFallback() {
  return (
    <header className="app-header" aria-hidden="true">
      <div className="top">
        <h1 className="brand-fallback">
          <span>Trip to:</span> Trip Hub
        </h1>
      </div>
    </header>
  );
}
