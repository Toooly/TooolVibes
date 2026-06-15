import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { getPublishedTools } from "@/lib/data/public-tools";

export default async function ShortlistPage() {
  const tools = await getPublishedTools();

  return <MobileShortlistBoard tools={tools} />;
}
