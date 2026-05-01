import type { ReactNode } from "react";

import { SectionHeading } from "@/components/sections/section-heading";

type SurfaceIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  helperEyebrow?: string;
  helperCopy?: string;
  actions?: ReactNode;
  asideEyebrow: string;
  asideTitle: string;
  asideCopy: string;
};

export function SurfaceIntro({
  eyebrow,
  title,
  description,
  helperEyebrow,
  helperCopy,
  actions,
  asideEyebrow,
  asideTitle,
  asideCopy,
}: SurfaceIntroProps) {
  return (
    <section className="dark-panel brand-aura panel-lift section-stage surface-intro-stage relative overflow-hidden rounded-[36px] p-5 text-white sm:p-6 lg:p-7">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_74%)]" />
      <div className="absolute -right-10 top-12 h-36 w-36 rounded-full bg-[rgba(99,50,255,0.12)] blur-3xl" />
      <div className="absolute left-8 top-16 h-[4.5rem] w-[4.5rem] rounded-full bg-[rgba(255,200,61,0.12)] blur-3xl" />
      <div className="absolute bottom-8 right-[32%] h-20 w-20 rounded-full bg-[rgba(68,220,255,0.1)] blur-3xl" />

      <div className="editorial-grid relative items-start gap-y-6">
        <div className="col-span-12 lg:col-span-8">
          <SectionHeading eyebrow={eyebrow} title={title} description={description} invert />

          {helperEyebrow || helperCopy || actions ? (
            <div className="surface-intro-helper surface-intro-helper-dark mt-5 max-w-[41rem] rounded-[24px] px-4.5 py-4 sm:px-5 sm:py-4.5">
              {helperEyebrow ? <p className="brand-kicker !text-white/58">{helperEyebrow}</p> : null}
              {helperCopy ? (
                <p
                  className="mt-2 text-[0.94rem] leading-7 sm:text-[0.98rem]"
                  style={{ color: "rgba(255,255,255,0.74)" }}
                >
                  {helperCopy}
                </p>
              ) : null}
              {actions ? (
                <div className="mt-3.5 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="surface-intro-aside panel-lift rounded-[28px] p-4.5 sm:p-5 lg:ml-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[var(--gold)] shadow-[0_0_0_5px_rgba(243,191,76,0.14)]" />
              <p className="editorial-label !text-white/60">{asideEyebrow}</p>
            </div>
            <p className="mt-3 text-[1.48rem] leading-[1.02] text-white sm:text-[1.72rem]">{asideTitle}</p>
            <p className="mt-3 text-sm leading-7 text-white/72">{asideCopy}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
