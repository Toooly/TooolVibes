export default function ShortlistLoading() {
  return (
    <div className="shortlist-final-surface">
      <div
        className="mobile-library-board"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Caricamento salvati"
      >
        <section className="mobile-library-hero">
          <div className="grid gap-4">
            <div className="skeleton-block h-5 w-40 rounded-full" />
            <div className="skeleton-block h-14 max-w-[34rem] rounded-[18px]" />
            <div className="skeleton-block h-16 max-w-[44rem] rounded-[18px]" />
          </div>
          <div className="mobile-library-hero__stats">
            <div className="skeleton-block h-20 rounded-[16px]" />
            <div className="skeleton-block h-20 rounded-[16px]" />
          </div>
        </section>

        <section className="mobile-library-board__compare">
          <div className="skeleton-block h-5 w-44 rounded-full" />
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="skeleton-block h-9 w-24 rounded-full" />
            <div className="skeleton-block h-9 w-28 rounded-full" />
            <div className="skeleton-block h-9 w-36 rounded-full" />
          </div>
        </section>

        <section className="mobile-library-shelf">
          <div className="mobile-library-shelf__header">
            <div className="skeleton-block h-7 w-32 rounded-[12px]" />
          </div>
          <div className="mobile-library-shelf__rail">
            <div className="skeleton-block h-52 min-w-36 flex-1 rounded-[18px]" />
            <div className="skeleton-block h-52 min-w-36 flex-1 rounded-[18px]" />
            <div className="skeleton-block h-52 min-w-36 flex-1 rounded-[18px]" />
          </div>
        </section>
      </div>
    </div>
  );
}
