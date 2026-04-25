export default function CompareLoading() {
  return (
    <div className="page-shell space-y-6 pb-24 pt-8 sm:space-y-8 sm:pb-28 sm:pt-10">
      <section className="brand-panel brand-aura rounded-[36px] p-6 sm:p-7 lg:p-8">
        <div className="editorial-grid gap-y-7">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="skeleton-block h-8 w-32 rounded-full" />
            <div className="skeleton-block h-14 max-w-[32rem] rounded-[24px]" />
            <div className="skeleton-block h-20 max-w-[42rem] rounded-[24px]" />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="skeleton-block h-36 rounded-[30px]" />
          </div>
        </div>
      </section>

      <section className="brand-panel rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="space-y-5">
          <div className="skeleton-block h-24 rounded-[28px]" />
          <div className="skeleton-block h-[26rem] rounded-[30px]" />
        </div>
      </section>
    </div>
  );
}
