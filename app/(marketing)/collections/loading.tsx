/**
 * Collections Index loading — skeleton that mirrors V4 geometry:
 *   - Masthead        (eyebrow + title + lede + meta strip)
 *   - Discover strip  (lede-block + compare strip)
 *   - Featured lead   (single hero card)
 *   - 4 group grids   (header + grid of cards)
 *
 * Uses `.skeleton-block--on-dark` so the placeholder reads on the
 * dark collections canvas (default `.skeleton-block` ships ivory).
 */
export default function CollectionsLoading() {
  return (
    <div
      className="cx-index"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Caricamento raccolte"
    >
      <div className="cx-index__inner">
        <header className="cx-index__masthead">
          <div className="space-y-4">
            <div className="skeleton-block--on-dark h-5 w-24 rounded-full" />
            <div className="skeleton-block--on-dark h-10 w-full max-w-[24rem] rounded-[14px] sm:h-12" />
            <div className="skeleton-block--on-dark h-10 w-full max-w-[18rem] rounded-[14px] sm:hidden" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="skeleton-block--on-dark h-4 w-full max-w-[34rem] rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-full max-w-[40rem] rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-full max-w-[28rem] rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-full max-w-[20rem] rounded-full" />
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="skeleton-block--on-dark h-4 w-32 rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-28 rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-36 rounded-full" />
            </div>
          </div>
        </header>

        <section className="cx-index__discover">
          <div className="cx-index__lede-block space-y-4">
            <div className="skeleton-block--on-dark h-7 w-full max-w-[28rem] rounded-[10px]" />
            <div className="space-y-2">
              <div className="skeleton-block--on-dark h-4 w-full max-w-[44rem] rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-full max-w-[36rem] rounded-full" />
            </div>
            <dl className="cx-index__compare-strip" aria-hidden="true">
              <div className="space-y-1.5">
                <div className="skeleton-block--on-dark h-3 w-20 rounded-full" />
                <div className="skeleton-block--on-dark h-4 w-28 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="skeleton-block--on-dark h-3 w-20 rounded-full" />
                <div className="skeleton-block--on-dark h-4 w-28 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="skeleton-block--on-dark h-3 w-20 rounded-full" />
                <div className="skeleton-block--on-dark h-4 w-28 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="skeleton-block--on-dark h-3 w-20 rounded-full" />
                <div className="skeleton-block--on-dark h-4 w-32 rounded-full" />
              </div>
            </dl>
          </div>
        </section>

        <section className="cx-index__start">
          <div className="cx-index__section-title">
            <div className="skeleton-block--on-dark h-7 w-40 rounded-[10px]" />
            <div className="skeleton-block--on-dark h-4 w-56 rounded-full" />
          </div>
          <div className="cx-index__grid cx-index__grid--lead">
            <div className="skeleton-block--on-dark h-[18rem] w-full rounded-[24px] sm:h-[20rem]" />
          </div>
        </section>

        {[0, 1, 2, 3].map((groupIdx) => (
          <section
            key={groupIdx}
            className="cx-index__group"
            aria-hidden="true"
          >
            <div className="cx-index__group-header">
              <div className="skeleton-block--on-dark h-3 w-28 rounded-full" />
              <div className="skeleton-block--on-dark h-7 w-40 rounded-[10px]" />
              <div className="skeleton-block--on-dark h-4 w-full max-w-[32rem] rounded-full" />
            </div>
            <div className="cx-index__grid cx-index__grid--group">
              <div className="skeleton-block--on-dark h-[14rem] rounded-[20px]" />
              <div className="skeleton-block--on-dark h-[14rem] rounded-[20px]" />
              <div className="skeleton-block--on-dark h-[14rem] rounded-[20px]" />
            </div>
          </section>
        ))}

        <section className="cx-index__principles" aria-hidden="true">
          <div className="cx-index__section-title">
            <div className="skeleton-block--on-dark h-7 w-56 rounded-[10px]" />
            <div className="skeleton-block--on-dark h-4 w-48 rounded-full" />
          </div>
          <div className="cx-index__principles-grid">
            <div className="skeleton-block--on-dark h-[10rem] rounded-[18px]" />
            <div className="skeleton-block--on-dark h-[10rem] rounded-[18px]" />
            <div className="skeleton-block--on-dark h-[10rem] rounded-[18px]" />
          </div>
        </section>
      </div>
    </div>
  );
}
