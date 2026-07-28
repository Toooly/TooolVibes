import { ToolCardSkeleton } from "@/components/tools/tool-card-skeleton";

export default function ToolProfileLoading() {
  return (
    <div
      className="page-shell space-y-6 pb-18 pt-8 sm:space-y-8 sm:pb-22 sm:pt-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Caricamento scheda tool"
    >
      <section className="brand-panel brand-aura overflow-hidden rounded-[36px]">
        <div className="editorial-grid gap-y-0">
          <div className="col-span-12 space-y-5 p-6 sm:p-7 lg:col-span-7 lg:p-8">
            <div className="skeleton-block h-4 w-36 rounded-full" />
            <div className="skeleton-block h-8 w-56 rounded-full" />
            <div className="skeleton-block h-16 max-w-[24rem] rounded-[24px]" />
            <div className="skeleton-block h-20 rounded-[26px]" />
            <div className="flex gap-3">
              <div className="skeleton-block h-11 w-40 rounded-full" />
              <div className="skeleton-block h-11 w-40 rounded-full" />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div className="skeleton-block min-h-[22rem] lg:min-h-[36rem]" />
          </div>
        </div>
      </section>

      <section className="editorial-grid gap-y-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="brand-panel rounded-[32px] p-6 sm:p-7">
            <div className="space-y-4">
              <div className="skeleton-block h-10 w-64 rounded-full" />
              <div className="grid gap-3.5 sm:grid-cols-3">
                <div className="skeleton-block h-24 rounded-[24px]" />
                <div className="skeleton-block h-24 rounded-[24px]" />
                <div className="skeleton-block h-24 rounded-[24px]" />
              </div>
              <div className="skeleton-block h-28 rounded-[26px]" />
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="skeleton-block h-44 rounded-[30px]" />
          <div className="skeleton-block h-40 rounded-[30px]" />
        </div>
      </section>

      <section className="brand-panel rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="mb-6 space-y-3">
          <div className="skeleton-block h-8 w-48 rounded-full" />
          <div className="skeleton-block h-5 w-96 max-w-full rounded-full" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ToolCardSkeleton compact />
          <ToolCardSkeleton compact />
          <ToolCardSkeleton compact />
        </div>
      </section>
    </div>
  );
}
