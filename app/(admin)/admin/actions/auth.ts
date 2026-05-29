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

export async function loginAdmin(formData: FormData) {
  if (await isLoginRateLimited()) {
    redirect("/admin/login?error=1");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

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
