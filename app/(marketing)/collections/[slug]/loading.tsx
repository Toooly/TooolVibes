/**
 * Collection Detail loading — skeleton that mirrors V4 geometry:
 *   1. Hero (composed)     — identity zone + stack glance + decision + actions
 *   2. Stack flow          — vertical spine with N nodes
 *   3. Variant paths       — tabs + panel
 *   4. Decision notes      — editorial grid
 *   5. Scenario            — spine with steps
 *   6. Anti-recommendation — callout block
 *   7. Guide bridge        — link list
 *   8. Next step           — card grid
 *
 * No two-column image hero (legacy V1/V2/V3). No 3 big cards. Density
 * matches the composed V4 detail layout. Uses `.skeleton-block--on-dark`
 * to read on the dark collections canvas.
 */
export default function CollectionDetailLoading() {
  return (
    <div
      className="cx-detail-v4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Caricamento raccolta"
    >
      {/* HERO — composed: identity + stack glance + decision + actions */}
      <header className="cx-detail-hero-v4">
        <div className="cx-detail-hero-v4__inner space-y-5">
          <div className="cx-detail-hero-v4__identity space-y-3">
            <div className="cx-detail-hero-v4__eyebrow">
              <div className="skeleton-block--on-dark h-3 w-28 rounded-full" />
              <div className="skeleton-block--on-dark h-3 w-16 rounded-full" />
              <div className="skeleton-block--on-dark h-3 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="skeleton-block--on-dark h-9 w-full max-w-[22rem] rounded-[14px] sm:h-11" />
              <div className="skeleton-block--on-dark h-9 w-full max-w-[16rem] rounded-[14px] sm:hidden" />
            </div>
            <div className="space-y-2">
              <div className="skeleton-block--on-dark h-4 w-full max-w-[36rem] rounded-full" />
              <div className="skeleton-block--on-dark h-4 w-full max-w-[28rem] rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="skeleton-block--on-dark h-6 w-24 rounded-full" />
              <div className="skeleton-block--on-dark h-6 w-20 rounded-full" />
            </div>
          </div>

          <div className="cx-detail-hero-v4__stack space-y-3">
            <div className="cx-detail-hero-v4__stack-head">
              <div className="skeleton-block--on-dark h-3 w-28 rounded-full" />
              <div className="skeleton-block--on-dark h-3 w-24 rounded-full" />
            </div>
            <div className="flex gap-2 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton-block--on-dark h-[5.5rem] w-[5.5rem] flex-none rounded-[14px]"
                />
              ))}
            </div>
          </div>

          <div className="cx-detail-hero-v4__decision flex flex-wrap gap-x-6 gap-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="skeleton-block--on-dark h-3 w-14 rounded-full" />
                <div className="skeleton-block--on-dark h-4 w-20 rounded-full" />
              </div>
            ))}
          </div>

          <div className="cx-detail-hero-v4__actions flex flex-wrap gap-3">
            <div className="skeleton-block--on-dark h-11 w-36 rounded-full" />
            <div className="skeleton-block--on-dark h-11 w-44 rounded-full" />
          </div>
        </div>
      </header>

      {/* STACK FLOW — vertical spine */}
      <section className="cx-stack-flow-v4" aria-hidden="true">
        <div className="cx-stack-flow-v4__head space-y-3">
          <div className="skeleton-block--on-dark h-3 w-32 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[24rem] rounded-[12px]" />
          <div className="skeleton-block--on-dark h-4 w-full max-w-[40rem] rounded-full" />
        </div>
        <div className="cx-stack-flow-v4__list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="cx-stack-flow-v4__item">
              <div className="cx-stack-flow-v4__node">
                <div className="skeleton-block--on-dark h-3 w-6 rounded-full" />
              </div>
              <div className="cx-stack-flow-v4__stage space-y-3">
                <div className="flex gap-2">
                  <div className="skeleton-block--on-dark h-3 w-16 rounded-full" />
                  <div className="skeleton-block--on-dark h-5 w-32 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <div className="skeleton-block--on-dark h-14 w-14 flex-none rounded-[12px]" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-block--on-dark h-4 w-full max-w-[28rem] rounded-full" />
                    <div className="skeleton-block--on-dark h-4 w-full max-w-[36rem] rounded-full" />
                    <div className="flex gap-2 pt-1">
                      <div className="skeleton-block--on-dark h-7 flex-1 max-w-[10rem] rounded-[10px]" />
                      <div className="skeleton-block--on-dark h-7 flex-1 max-w-[10rem] rounded-[10px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VARIANT PATHS — tabs + panel */}
      <section className="cx-variant-paths-v4" aria-hidden="true">
        <div className="cx-variant-paths-v4__head space-y-3">
          <div className="skeleton-block--on-dark h-3 w-28 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[26rem] rounded-[12px]" />
          <div className="skeleton-block--on-dark h-4 w-full max-w-[40rem] rounded-full" />
        </div>
        <div className="cx-variant-paths-v4__tabs flex gap-2 pt-2">
          <div className="skeleton-block--on-dark h-9 w-32 rounded-full" />
          <div className="skeleton-block--on-dark h-9 w-32 rounded-full" />
        </div>
        <div className="cx-variant-paths-v4__panel space-y-3 pt-4">
          <div className="skeleton-block--on-dark h-5 w-full max-w-[20rem] rounded-full" />
          <div className="skeleton-block--on-dark h-4 w-full max-w-[36rem] rounded-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
            <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
            <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
          </div>
        </div>
      </section>

      {/* DECISION NOTES */}
      <section className="cx-decision-notes-v4" aria-hidden="true">
        <div className="space-y-3">
          <div className="skeleton-block--on-dark h-3 w-32 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[24rem] rounded-[12px]" />
        </div>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
          <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
          <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
          <div className="skeleton-block--on-dark h-[7rem] rounded-[14px]" />
        </div>
      </section>

      {/* SCENARIO */}
      <section className="cx-scenario-v4" aria-hidden="true">
        <div className="space-y-3">
          <div className="skeleton-block--on-dark h-3 w-24 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[28rem] rounded-[12px]" />
        </div>
        <div className="cx-scenario-v4__steps">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cx-scenario-v4__step">
              <div className="cx-scenario-v4__step-num">
                <div className="skeleton-block--on-dark h-3 w-5 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="skeleton-block--on-dark h-4 w-full max-w-[36rem] rounded-full" />
                <div className="skeleton-block--on-dark h-4 w-full max-w-[28rem] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ANTI-RECOMMENDATION */}
      <section className="cx-anti-rec-v4" aria-hidden="true">
        <div className="space-y-3">
          <div className="skeleton-block--on-dark h-3 w-32 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[26rem] rounded-[12px]" />
          <div className="space-y-2 pt-1">
            <div className="skeleton-block--on-dark h-4 w-full max-w-[40rem] rounded-full" />
            <div className="skeleton-block--on-dark h-4 w-full max-w-[32rem] rounded-full" />
          </div>
        </div>
        <div className="skeleton-block--on-dark mt-4 h-[6rem] rounded-[14px]" />
      </section>

      {/* GUIDE BRIDGE */}
      <section className="cx-guide-bridge-v4" aria-hidden="true">
        <div className="space-y-3">
          <div className="skeleton-block--on-dark h-3 w-28 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[24rem] rounded-[12px]" />
        </div>
        <ul className="cx-guide-bridge-v4__list space-y-2 pt-2">
          {[0, 1].map((i) => (
            <li key={i} className="skeleton-block--on-dark h-[3.5rem] rounded-[12px]" />
          ))}
        </ul>
      </section>

      {/* NEXT STEP */}
      <section className="cx-next-step-v4" aria-hidden="true">
        <div className="space-y-3">
          <div className="skeleton-block--on-dark h-3 w-28 rounded-full" />
          <div className="skeleton-block--on-dark h-7 w-full max-w-[24rem] rounded-[12px]" />
        </div>
        <div className="cx-next-step-v4__grid grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="skeleton-block--on-dark h-[10rem] rounded-[18px]" />
          <div className="skeleton-block--on-dark h-[10rem] rounded-[18px]" />
          <div className="skeleton-block--on-dark h-[10rem] rounded-[18px]" />
        </div>
      </section>
    </div>
  );
}
