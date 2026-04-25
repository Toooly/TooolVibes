import { cn } from "@/lib/utils";

type ToolCardSkeletonProps = {
  compact?: boolean;
  featured?: boolean;
  scan?: boolean;
};

export function ToolCardSkeleton({
  compact = false,
  featured = false,
  scan = false,
}: ToolCardSkeletonProps) {
  if (scan) {
    return (
      <div className="tool-card-base rounded-[24px] p-3.5">
        <div className="flex items-start gap-3">
          <div className="skeleton-block h-[4.25rem] w-[4.25rem] rounded-[16px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-block h-3 w-20 rounded-full" />
            <div className="skeleton-block h-5 w-28 rounded-full" />
            <div className="skeleton-block h-4 w-full rounded-full" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 soft-divider">
          <div className="skeleton-block h-8 w-24 rounded-full" />
          <div className="skeleton-block h-4 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (featured) {
    return (
      <div className="tool-card-base tool-card-featured overflow-hidden rounded-[32px]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="skeleton-block min-h-[18rem] sm:min-h-[20rem]" />
          <div className="space-y-4 p-5 sm:p-6 lg:p-7">
            <div className="skeleton-block h-6 w-36 rounded-full" />
            <div className="skeleton-block h-9 w-3/4 rounded-[18px]" />
            <div className="skeleton-block h-5 w-full rounded-full" />
            <div className="skeleton-block h-5 w-5/6 rounded-full" />
            <div className="flex gap-2">
              <div className="skeleton-block h-8 w-20 rounded-full" />
              <div className="skeleton-block h-8 w-24 rounded-full" />
            </div>
            <div className="flex gap-3 border-t pt-4 soft-divider">
              <div className="skeleton-block h-10 w-32 rounded-full" />
              <div className="skeleton-block h-10 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("tool-card-base overflow-hidden rounded-[28px]", compact && "tool-card-compact")}>
      <div className={cn("skeleton-block", compact ? "h-44" : "h-52")} />
      <div className="space-y-4 p-4.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="skeleton-block h-3 w-24 rounded-full" />
            <div className="skeleton-block h-8 w-32 rounded-[16px]" />
          </div>
          <div className="skeleton-block h-6 w-8 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="skeleton-block h-4 w-full rounded-full" />
          <div className="skeleton-block h-4 w-5/6 rounded-full" />
        </div>
        <div className="grid gap-3 rounded-[22px] sm:grid-cols-2">
          <div className="skeleton-block h-16 rounded-[18px]" />
          <div className="skeleton-block h-16 rounded-[18px]" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-block h-8 w-20 rounded-full" />
          <div className="skeleton-block h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
