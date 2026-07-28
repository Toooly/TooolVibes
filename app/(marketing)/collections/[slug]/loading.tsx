export default function CollectionDetailLoading() {
  return (
    <div
      className="page-shell space-y-6 pb-18 pt-8 sm:space-y-8 sm:pb-22 sm:pt-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Caricamento raccolta"
    >
      <section className="brand-panel rounded-[36px] p-6 sm:p-7 lg:p-8">
        <div className="editorial-grid gap-y-6">
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="skeleton-block h-6 w-36 rounded-full" />
            <div className="skeleton-block h-14 w-full max-w-[26rem] rounded-[22px]" />
            <div className="skeleton-block h-5 w-full max-w-[40rem] rounded-[20px]" />
            <div className="skeleton-block h-5 w-full max-w-[34rem] rounded-[20px]" />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div className="skeleton-block h-[22rem] w-full rounded-[28px]" />
          </div>
        </div>
      </section>

      <section className="brand-panel rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-block h-[20rem] w-full rounded-[28px]" />
          ))}
        </div>
      </section>
    </div>
  );
}
