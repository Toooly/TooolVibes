import { MobileMethodRoom } from "@/components/method/mobile-method-room";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicPageMetadata({
  title: "Metodo",
  description: "Scopri, confronta, salva. Il percorso chiaro per scegliere tool AI validi.",
  path: "/metodo",
});

export default function MetodoPage() {
  return <MobileMethodRoom />;
}
