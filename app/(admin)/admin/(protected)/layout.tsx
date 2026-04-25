import { FounderControlCenter } from "@/components/admin/founder-control-center";
import { getAdminCollectionsRuntime } from "@/lib/admin/collection-queries";
import { getAdminToolsRuntime } from "@/lib/admin/tool-queries";
import { requireAdminSession } from "@/lib/admin/session";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const [toolsRuntime, collectionsRuntime] = await Promise.all([
    getAdminToolsRuntime(),
    getAdminCollectionsRuntime(),
  ]);

  return (
    <div
      className="min-h-screen pb-10"
      style={{
        background:
          "radial-gradient(circle at 14% 8%, rgba(99,50,255,0.18), transparent 24%), radial-gradient(circle at 84% 12%, rgba(68,220,255,0.12), transparent 20%), radial-gradient(circle at 18% 76%, rgba(255,200,61,0.1), transparent 18%), linear-gradient(180deg, #f6f4ff 0%, #eee9ff 46%, #e5ddff 100%)",
      }}
    >
      <FounderControlCenter
        toolsRuntime={toolsRuntime}
        collectionsRuntime={collectionsRuntime}
      />
      {children}
    </div>
  );
}
