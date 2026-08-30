import { FounderControlCenterV2 } from "@/components/admin/founder-control-center-v2";
import { SiteUniverseBackgroundLazy } from "@/components/app/site-universe-background-lazy";
import { getAdminArticlesRuntime } from "@/lib/admin/article-queries";
import { getSuggestionsRuntime } from "@/lib/admin/suggestion-queries";
import { requireAdminSession } from "@/lib/admin/session";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const [articlesRuntime, toolsRuntime, suggestionsRuntime] = await Promise.all([
    getAdminArticlesRuntime(),
    getAdminToolsRuntime(),
    getSuggestionsRuntime(),
  ]);

  return (
    <div className="relative min-h-screen overflow-x-clip" data-admin-shell>
      <SiteUniverseBackgroundLazy />
      <div className="relative z-10">
        <FounderControlCenterV2
          articlesRuntime={articlesRuntime}
          adminMetrics={{
            tools: toolsRuntime.tools.length,
            publishedTools: toolsRuntime.tools.filter((tool) => tool.is_published).length,
            openSuggestions: suggestionsRuntime.pendingCount,
            writeReady: articlesRuntime.canWrite && toolsRuntime.canWrite,
          }}
        />
        <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
