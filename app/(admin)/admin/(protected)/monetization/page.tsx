import Link from "next/link";
import {
  BadgeDollarSign,
  CalendarClock,
  ExternalLink,
  LayoutGrid,
  Megaphone,
  Sparkles,
} from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import {
  getMonetizationPlacementStats,
  monetizationPlacements,
  type MonetizationStatus,
} from "@/lib/monetization/placements";

const statusLabel: Record<MonetizationStatus, string> = {
  ready: "Attivo",
  reserved: "Prenotabile",
  planned: "In arrivo",
};

const statusTone: Record<MonetizationStatus, { border: string; background: string; color: string }> = {
  ready: {
    border: "rgba(57,210,246,0.28)",
    background: "rgba(57,210,246,0.1)",
    color: "#9eefff",
  },
  reserved: {
    border: "rgba(243,191,76,0.28)",
    background: "rgba(243,191,76,0.1)",
    color: "#f3bf4c",
  },
  planned: {
    border: "rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.72)",
  },
};

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof BadgeDollarSign;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/45">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/8 text-white">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/58">{detail}</p>
    </article>
  );
}

export default function AdminMonetizationPage() {
  const stats = getMonetizationPlacementStats();
  const publicPlacements = monetizationPlacements.filter((placement) => placement.visible);
  const plannedPlacements = monetizationPlacements.filter((placement) => !placement.visible);

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="space-y-6">
        <section
          className="relative overflow-hidden rounded-[32px] border p-6 text-white sm:p-8"
          style={{
            borderColor: "rgba(255,255,255,0.09)",
            background:
              "radial-gradient(circle at 82% 10%, rgba(243,191,76,0.14), transparent 30%), radial-gradient(circle at 5% 0%, rgba(106,60,255,0.2), transparent 34%), linear-gradient(145deg, rgba(18,13,46,0.98), rgba(7,6,18,0.98))",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <SectionHeading
              eyebrow="Monetizzazione"
              title="Inventory nativa TooolVibes"
              description="Una mappa operativa degli spazi partner: homepage, catalogo, guide, schede tool, raccolte e newsletter. Gli slot sono pensati per sembrare parte del prodotto, non banner esterni."
              invert
            />
            <Link
              href="/affiliati"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#160d3d]"
            >
              Vedi pagina partner
              <ExternalLink size={14} />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Slot totali" value={stats.total} detail="Inventory commerciale mappata nel prodotto." icon={LayoutGrid} />
            <StatCard label="Visibili" value={stats.visible} detail="Placement gia' predisposti nelle pagine pubbliche." icon={Sparkles} />
            <StatCard label="Prenotabili" value={stats.reserved} detail="Spazi pronti per sponsor o founder pack." icon={BadgeDollarSign} />
            <StatCard label="Pianificati" value={stats.planned} detail="Superfici da attivare quando parte il canale." icon={CalendarClock} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            {publicPlacements.map((placement) => {
              const tone = statusTone[placement.status];

              return (
                <article
                  key={placement.key}
                  className="rounded-[28px] border p-5 text-white sm:p-6"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background:
                      "radial-gradient(circle at 100% 0%, rgba(57,210,246,0.1), transparent 30%), linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/45">
                        {placement.surface} / {placement.format}
                      </p>
                      <h2 className="mt-3 text-[1.35rem] font-semibold leading-tight">{placement.packageName}</h2>
                    </div>
                    <span
                      className="inline-flex rounded-full border px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.16em]"
                      style={{
                        borderColor: tone.border,
                        background: tone.background,
                        color: tone.color,
                      }}
                    >
                      {statusLabel[placement.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/64">{placement.body}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.045] px-4 py-3">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/42">Audience</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{placement.audience}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.045] px-4 py-3">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/42">CTA pubblica</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">
                        {placement.ctaLabel} / {placement.href}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/8">
                  <Megaphone size={17} />
                </span>
                <div>
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/45">Regola prodotto</p>
                  <p className="text-sm font-semibold">Native first</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/64">
                Ogni sponsor deve entrare con contesto, disclosure e utilit&agrave;. Se non aiuta la scelta del tool, non entra nella pagina.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-white">
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/45">Da collegare dopo</p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-white/66">
                <p>Campagne con data inizio/fine, asset, sponsor e URL tracciati.</p>
                <p>Reporting click/impression e pacchetti founder.</p>
                <p>CRUD Supabase sulla tabella sponsorship_placements.</p>
              </div>
            </div>

            {plannedPlacements.length > 0 ? (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-white">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-white/45">Non ancora visibili</p>
                <div className="mt-4 grid gap-3">
                  {plannedPlacements.map((placement) => (
                    <div key={placement.key} className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3.5 py-3">
                      <p className="text-sm font-semibold">{placement.surface}</p>
                      <p className="mt-1 text-xs leading-5 text-white/52">{placement.packageName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </div>
  );
}
