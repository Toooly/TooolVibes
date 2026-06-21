import { FounderControlCenterV2 } from "@/components/admin/founder-control-center-v2";
import { SiteUniverseBackground } from "@/components/app/site-universe-background";
import { getAdminArticlesRuntime } from "@/lib/admin/article-queries";
import { requireAdminSession } from "@/lib/admin/session";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const articlesRuntime = await getAdminArticlesRuntime();

  return (
    <div className="relative min-h-screen overflow-x-clip" data-admin-shell>
      <SiteUniverseBackground />
      <div className="relative z-10">
        <FounderControlCenterV2 articlesRuntime={articlesRuntime} />
        <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
