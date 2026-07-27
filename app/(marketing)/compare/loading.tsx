export default function CompareLoading() {
  return (
    <div className="compare-space-page">
      <section className="tool-battle-page" aria-busy="true" aria-label="Caricamento confronto">
        <header className="tool-battle-page__intro">
          <div className="skeleton-block h-5 w-36 rounded-full" />
          <div className="skeleton-block h-14 max-w-[38rem] rounded-[18px]" />
          <div className="skeleton-block h-16 max-w-[46rem] rounded-[18px]" />
          <div className="grid max-w-[32rem] grid-cols-3 gap-3">
            <div className="skeleton-block h-10 rounded-[14px]" />
            <div className="skeleton-block h-10 rounded-[14px]" />
            <div className="skeleton-block h-10 rounded-[14px]" />
          </div>
        </header>

        <div className="tool-battle-page__viewport">
          <div className="grid gap-4">
            <div className="skeleton-block h-24 rounded-[20px]" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="skeleton-block h-72 rounded-[24px]" />
              <div className="skeleton-block h-72 rounded-[24px]" />
            </div>
            <div className="skeleton-block h-36 rounded-[20px]" />
          </div>
        </div>
      </section>
    </div>
  );
}
