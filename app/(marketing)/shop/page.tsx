import { siteConfig } from "@/lib/config/site";

export default function ShopPage() {
  return (
    <div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section className="overflow-hidden rounded-[30px] border border-[rgba(83,63,170,0.12)] bg-[linear-gradient(135deg,#171129_0%,#23144d_56%,#140d28_100%)] px-5 py-5 text-white shadow-[0_28px_80px_rgba(18,10,51,0.28)] sm:rounded-[38px] sm:px-7 sm:py-8">
        <div className="max-w-[44rem]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/60">
            Digital Shop
          </p>
          <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,10vw,2.75rem)] leading-[0.96] text-white sm:text-[3.4rem]">
            Asset, selezioni premium e shortcut per lavorare più veloce.
          </h1>
          <p className="mt-4 max-w-[40rem] text-[0.98rem] leading-7 text-white/74 sm:mt-5 sm:text-[1rem]">
            Il Digital Shop è il layer esterno in cui TooolVibes porta raccolte premium, risorse e
            percorsi più densi. Qui il punto non è aggiungere rumore: è darti materiali più
            pronti all&apos;uso.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={siteConfig.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/24 bg-white px-5 py-3.5 text-sm font-semibold shadow-[0_16px_34px_rgba(255,255,255,0.12)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{ color: "#24144d" }}
            >
              Apri il Digital Shop
            </a>
            <a
              href={siteConfig.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3.5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
              style={{ color: "#ffffff" }}
            >
              Vai allo shop esterno
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 md:gap-5">
        {[
          {
            title: "Stack curati",
            copy: "Selezioni premium di tool e workflow già ragionate per creator, founder e team piccoli.",
          },
          {
            title: "Risorse operative",
            copy: "Materiali che riducono attrito: più esempi concreti, meno teoria che non porta al test.",
          },
          {
            title: "Shortcut più densi",
            copy: "Il layer premium serve quando vuoi velocizzare il passaggio tra scoperta, scelta e implementazione.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="light-surface rounded-[24px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-4 shadow-[0_18px_54px_rgba(35,18,95,0.08)] sm:rounded-[30px] sm:p-5"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Premium
            </p>
            <h2 className="mt-3 text-[1.38rem] leading-[1.02] text-[var(--foreground)]">
              {item.title}
            </h2>
            <p className="mt-4 text-[0.98rem] leading-7 text-[var(--muted-strong)]">
              {item.copy}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
