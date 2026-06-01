import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const maxFileSize = 50 * 1024 * 1024;

function safeFileName(value: string) {
  const [name = "media", extension = ""] = value.split(/\.([^.]+)$/);
  const safeName =
    name
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "media";
  const safeExtension = extension.replace(/[^\w]/g, "").toLowerCase();

  return safeExtension ? `${safeName}.${safeExtension}` : safeName;
}

export async function POST(request: Request) {
  await requireAdminSession();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File mancante." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { message: "Formato non supportato. Usa immagini, gif, mp4, webm o mov." },
      { status: 400 },
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { message: "File troppo grande. Limite massimo: 50 MB." },
      { status: 400 },
    );
  }

  const client = createAdminSupabaseClient();
  const datePrefix = new Date().toISOString().slice(0, 10);
  const path = `${datePrefix}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await client.storage.from("editorial-media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { message: `Upload non riuscito: ${error.message}` },
      { status: 500 },
    );
  }

  const { data } = client.storage.from("editorial-media").getPublicUrl(path);

  return NextResponse.json({
    url: data.publicUrl,
    path,
    mimeType: file.type,
  });
}
