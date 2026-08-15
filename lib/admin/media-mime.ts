export const MEDIA_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_MEDIA_UPLOAD_BYTES = 8 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export async function detectImageMimeType(file: File) {
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
  return null;
}

export function safeMediaFileName(value: string) {
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
  return safeExtension ? `${safeName}.${safeExtension}` : `${safeName}.bin`;
}

export function readPngSize(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}
