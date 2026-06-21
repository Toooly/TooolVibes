import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/session";
import {
  ARTICLE_MEDIA_BUCKET,
  ensureEditorialMediaBucket,
} from "@/lib/supabase/article-storage-repository";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const maxFileSize = 20 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

async function detectMediaMimeType(file: File) {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (startsWith(header, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(header, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(header, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (
    startsWith(header, [0x52, 0x49, 0x46, 0x46]) &&
    String.fromCharCode(...header.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  if (String.fromCharCode(...header.slice(4, 8)) === "ftyp") {
    return file.type === "video/quicktime" ? "video/quicktime" : "video/mp4";
  }
  if (startsWith(header, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";

  return null;
}

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

  const detectedMimeType = await detectMediaMimeType(file);

  if (!detectedMimeType || !allowedMimeTypes.has(detectedMimeType)) {
    return NextResponse.json(
      { message: "Il contenuto del file non corrisponde a un media supportato." },
      { status: 400 },
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { message: "File troppo grande. Limite massimo: 20 MB." },
      { status: 400 },
    );
  }

  const client = await ensureEditorialMediaBucket();
  const datePrefix = new Date().toISOString().slice(0, 10);
  const path = `${datePrefix}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await client.storage.from(ARTICLE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: detectedMimeType,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { message: `Upload non riuscito: ${error.message}` },
      { status: 500 },
    );
  }

  const { data } = client.storage.from(ARTICLE_MEDIA_BUCKET).getPublicUrl(path);

  return NextResponse.json({
    url: data.publicUrl,
    path,
    mimeType: detectedMimeType,
  });
}
