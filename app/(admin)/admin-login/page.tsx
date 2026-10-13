import { LocalizedText } from "@/components/i18n/localized-text";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LoginForm } from "@/components/admin/login-form";
import { PremiumPanel } from "@/components/ui/premium";
import { isAdminSessionUnlocked } from "@/lib/admin/session";
import { redirect } from "next/navigation";

const loginErrorCodes = ["credentials", "missing-fields", "rate-limited", "config"] as const;
type LoginErrorCode = (typeof loginErrorCodes)[number];

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function getLoginErrorCode(value: string | undefined): LoginErrorCode | null {
  if (value === "1") return "credentials";
  return loginErrorCodes.includes(value as LoginErrorCode) ? (value as LoginErrorCode) : null;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await isAdminSessionUnlocked()) {
    redirect("/admin");
  }

  const params = await searchParams;
  const errorCode = getLoginErrorCode(params.error);

  return (
    <div
      className="min-h-screen px-5 py-10 sm:py-14"
      style={{
        background:
          "radial-gradient(circle at 14% 8%, rgba(99,50,255,0.18), transparent 24%), radial-gradient(circle at 84% 12%, rgba(68,220,255,0.12), transparent 20%), radial-gradient(circle at 18% 76%, rgba(255,200,61,0.1), transparent 18%), var(--tv-color-surface-base)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-start sm:items-center">
        <PremiumPanel tone="dark" className="w-full p-5 text-white sm:p-7">
          <div className="flex items-center gap-3">
            <BrandLogo size={52} priority />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/64"><LocalizedText>{"TooolVibes "}</LocalizedText></p>
              <p className="text-sm text-white/58"><LocalizedText>{"Control Center"}</LocalizedText></p>
            </div>
          </div>
          <h1 className="mt-4 text-[2rem] leading-[1.1] sm:text-[2.2rem]"><LocalizedText>{"Accedi al backoffice"}</LocalizedText></h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-white/72"><LocalizedText>{"Gestisci contenuti, strumenti e attività commerciali da un unico spazio. "}</LocalizedText></p>
          <LoginForm errorCode={errorCode} />
        </PremiumPanel>
      </div>
    </div>
  );
}
