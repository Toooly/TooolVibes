import { cookies } from "next/headers";

import { releaseFeatures } from "@/lib/config/release-features";
import { gateCookieName } from "@/lib/gate/constants";
import { verifyGateToken } from "@/lib/gate/session";

export async function isPublicGateOpen() {
  if (!releaseFeatures.publicGate.enabled) {
    return true;
  }
  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(gateCookieName);
  return gateCookie ? await verifyGateToken(gateCookie.value) : false;
}
