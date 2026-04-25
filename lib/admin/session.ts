import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminCookieName = "tooolvibes_admin";

export function verifyAdminPassword(input: string) {
  const configuredPassword = process.env.TOOOLVIBES_ADMIN_PASSWORD;

  if (!configuredPassword) {
    return false;
  }

  const expected = Buffer.from(configuredPassword);
  const received = Buffer.from(input);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export async function isAdminSessionUnlocked() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === "unlocked";
}

export async function requireAdminSession() {
  if (!(await isAdminSessionUnlocked())) {
    redirect("/admin/login");
  }
}
