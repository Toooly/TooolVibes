export default function CollectionsLoading() {
  return (
    <div
      className="page-shell space-y-6 pb-18 pt-8 sm:space-y-8 sm:pb-22 sm:pt-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Caricamento raccolte"
    >
      <section className="brand-panel panel-lift rounded-[36px] p-6 sm:p-7 lg:p-8">
        <div className="skeleton-block h-6 w-32 rounded-full" />
        <div className="mt-5 space-y-3">
          <div className="skeleton-block h-12 w-full max-w-[34rem] rounded-[20px]" />
          <div className="skeleton-block h-5 w-full max-w-[42rem] rounded-[20px]" />
          <div className="skeleton-block h-5 w-full max-w-[36rem] rounded-[20px]" />
        </div>
      </section>

      <section className="brand-panel panel-lift rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="skeleton-block h-[26rem] w-full rounded-[28px]" />
      </section>
    </div>
  );
}
