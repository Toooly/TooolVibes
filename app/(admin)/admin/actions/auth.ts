"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  adminCookieName,
  createAdminSession,
  requireAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/session";
import { clearLoginAttempts, isLoginRateLimited, recordFailedLoginAttempt } from "./_helpers";

function normalizeEmailInput(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();
}

function normalizePasswordInput(value: FormDataEntryValue | null): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export async function loginAdmin(formData: FormData) {
  if (await isLoginRateLimited()) {
    redirect("/admin/login?error=1");
  }

  const email = normalizeEmailInput(formData.get("email"));
  const password = normalizePasswordInput(formData.get("password"));

  if (!email || !password || !(await verifyAdminCredentials(email, password))) {
    await recordFailedLoginAttempt();
    redirect("/admin/login?error=1");
  }

  await clearLoginAttempts();

  const token = await createAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  await requireAdminSession();
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
  redirect("/admin/login");
}
