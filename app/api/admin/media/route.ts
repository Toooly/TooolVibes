import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/session";
import {
  detectImageMimeType,
  MAX_MEDIA_UPLOAD_BYTES,
  MEDIA_IMAGE_MIME_TYPES,
  readPngSize,
  safeMediaFileName,
} from "@/lib/admin/media-mime";
import { getMediaCatalog, type MediaAsset } from "@/lib/admin/media-catalog";
import {
  ARTICLE_MEDIA_BUCKET,
  ensureEditorialMediaBucket,
} from "@/lib/supabase/article-storage-repository";

export const runtime = "nodejs";

async function readLibraryFile() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data/media-library.json"), "utf8");
    return JSON.parse(raw) as { assets?: MediaAsset[] };
  } catch {
    return { assets: [] };
  }
}

async function writeLibraryFile(assets: MediaAsset[]) {
  await fs.writeFile(
    path.join(process.cwd(), "data/media-library.json"),
    `${JSON.stringify({ assets }, null, 2)}\n`,
    "utf8",
  );
}

export async function GET() {
  await requireAdminSession();
  return NextResponse.json({ assets: getMediaCatalog().filter((asset) => !asset.archived) });
}

export async function POST(request: Request) {
  await requireAdminSession();
  const formData = await request.formData();
  const file = formData.get("file");
  const label = String(formData.get("label") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  const usedIn = String(formData.get("usedIn") ?? "Media library").trim() || "Media library";

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File mancante." }, { status: 400 });
  }
  if (!MEDIA_IMAGE_MIME_TYPES.includes(file.type as (typeof MEDIA_IMAGE_MIME_TYPES)[number]) && file.type) {
    return NextResponse.json({ message: "Solo immagini JPEG, PNG, WebP o GIF." }, { status: 400 });
  }
  const mime = await detectImageMimeType(file);
  if (!mime) {
    return NextResponse.json({ message: "Il file non è un'immagine supportata." }, { status: 400 });
  }
  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    return NextResponse.json({ message: "File troppo grande. Limite: 8 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = mime === "image/png" ? readPngSize(bytes) : null;
  const datePrefix = new Date().toISOString().slice(0, 10);
  const filename = `${crypto.randomUUID()}-${safeMediaFileName(file.name)}`;
  const storagePath = `library/${datePrefix}/${filename}`;
  let src = "";

  try {
    const client = await ensureEditorialMediaBucket();
    const { error } = await client.storage.from(ARTICLE_MEDIA_BUCKET).upload(storagePath, bytes, {
      cacheControl: "31536000",
      contentType: mime,
      upsert: false,
    });
    if (error) throw error;
    src = client.storage.from(ARTICLE_MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl;
  } catch {
    const localRel = path.join("public", "media", "library", datePrefix, filename);
    await fs.mkdir(path.dirname(path.join(process.cwd(), localRel)), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), localRel), bytes);
    src = `/media/library/${datePrefix}/${filename}`;
  }

  const asset: MediaAsset = {
    id: `upload-${datePrefix}-${filename.replace(/\.[^.]+$/, "")}`,
    kind: "editorial",
    label: label || file.name,
    src,
    alt: alt || label || file.name,
    usedIn,
    storagePath,
    mimeType: mime,
    fileSize: file.size,
    width: size?.width ?? null,
    height: size?.height ?? null,
    createdAt: new Date().toISOString(),
  };

  try {
    const current = await readLibraryFile();
    await writeLibraryFile([...(current.assets ?? []).filter((item) => item.id !== asset.id), asset]);
  } catch {
    // preview/edge without writable JSON still returns the uploaded URL
  }

  return NextResponse.json(asset);
}

export async function DELETE(request: Request) {
  await requireAdminSession();
  const { id } = (await request.json()) as { id?: string };
  if (!id || !id.startsWith("upload-")) {
    return NextResponse.json({ message: "Solo gli upload possono essere archiviati." }, { status: 400 });
  }
  try {
    const current = await readLibraryFile();
    const next = (current.assets ?? []).map((asset) =>
      asset.id === id ? { ...asset, archived: true } : asset,
    );
    await writeLibraryFile(next);
  } catch {
    return NextResponse.json({ message: "Archivio non persistente su questo runtime." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
