import { loginAdmin } from "@/app/(admin)/admin/actions";
import { BrandLogo } from "@/components/layout/brand-logo";
import { isAdminSessionUnlocked } from "@/lib/admin/session";
import { marketingStrings } from "@/lib/config/strings";
import { redirect } from "next/navigation";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await isAdminSessionUnlocked()) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <div
      className="min-h-screen px-5 py-10 sm:py-14"
      style={{
        background:
          "radial-gradient(circle at 14% 8%, rgba(99,50,255,0.18), transparent 24%), radial-gradient(circle at 84% 12%, rgba(68,220,255,0.12), transparent 20%), radial-gradient(circle at 18% 76%, rgba(255,200,61,0.1), transparent 18%), linear-gradient(180deg, #f6f4ff 0%, #eee9ff 46%, #e5ddff 100%)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-start sm:items-center">
        <div className="dark-panel brand-aura w-full rounded-[var(--radius-xl)] p-5 text-white sm:p-7">
          <div className="flex items-center gap-3">
            <BrandLogo size={52} priority />
            <div>
              <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-white/64">
                Admin gate
              </p>
              <p className="text-sm text-white/58">Founders access</p>
            </div>
          </div>
          <h1 className="mt-4 text-[2rem] leading-[1.02] sm:text-[2.2rem]">{marketingStrings.admin.loginTitle}</h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-white/72">
            {marketingStrings.admin.loginDescription}
          </p>

          <form action={loginAdmin} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/86">Password temporanea</span>
              <input
                type="password"
                name="password"
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                }}
                required
              />
            </label>

            {params.error ? (
              <p className="text-sm font-medium text-[#ffd1ca]">Password non valida.</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-strong), var(--accent) 70%, var(--cyan))",
              }}
            >
              Accedi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
