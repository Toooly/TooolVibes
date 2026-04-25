import { ToolCardSkeleton } from "@/components/tools/tool-card-skeleton";

export default function ShortlistLoading() {
  return (
    <div className="page-shell space-y-6 pb-18 pt-8 sm:space-y-8 sm:pb-22 sm:pt-10">
      <section className="brand-panel brand-aura rounded-[36px] p-6 sm:p-7 lg:p-8">
        <div className="editorial-grid gap-y-7">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="skeleton-block h-8 w-28 rounded-full" />
            <div className="skeleton-block h-14 max-w-[28rem] rounded-[24px]" />
            <div className="skeleton-block h-20 max-w-[40rem] rounded-[24px]" />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="skeleton-block h-36 rounded-[30px]" />
          </div>
        </div>
      </section>

      <section className="brand-panel rounded-[34px] p-6 sm:p-7 lg:p-8">
        <div className="space-y-5">
          <div className="skeleton-block h-24 rounded-[28px]" />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ToolCardSkeleton />
            <ToolCardSkeleton />
            <ToolCardSkeleton />
          </div>
        </div>
      </section>
    </div>
  );
}
