import { put } from "@vercel/blob";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/x-icon",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-m4v",
  "video/ogg",
  "video/3gpp",
  "video/x-flv",
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 200);
}

function detectMediaType(mimetype) {
  if (ALLOWED_IMAGE_TYPES.has(mimetype)) return "image";
  if (ALLOWED_VIDEO_TYPES.has(mimetype)) return "video";
  return null;
}

export async function uploadToBlob(file, folder = "uploads") {
  const { originalname, mimetype, buffer, size } = file;

  const mediaType = detectMediaType(mimetype);
  if (!mediaType) {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  const maxSize = mediaType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    throw new Error(`File too large. Maximum ${maxMB}MB for ${mediaType}s.`);
  }

  const timestamp = Date.now();
  const safeName = sanitizeFilename(originalname);
  const pathname = `${folder}/${timestamp}-${safeName}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: mimetype,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: mimetype,
    mediaType,
  };
}
