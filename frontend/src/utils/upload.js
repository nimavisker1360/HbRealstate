const API_URL = import.meta.env.VITE_API_URL;

const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg",
  "heic", "heif", "avif", "ico",
];
const ALLOWED_VIDEO_EXTENSIONS = [
  "mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv", "3gp", "flv",
];

export const IMAGE_ACCEPT = ALLOWED_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",");
export const VIDEO_ACCEPT = ALLOWED_VIDEO_EXTENSIONS.map((e) => `.${e}`).join(",");

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export async function uploadFiles(files, token, folder = "uploads", onProgress) {
  const fileArray = files instanceof FileList ? Array.from(files) : files;
  if (!fileArray.length) return [];

  const formData = new FormData();
  fileArray.forEach((file) => formData.append("files", file));
  if (folder) formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
            loadedFormatted: formatBytes(e.loaded),
            totalFormatted: formatBytes(e.total),
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.files);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.send(formData);
  });
}

export async function uploadSingleFile(file, token, folder = "uploads", onProgress) {
  const results = await uploadFiles([file], token, folder, onProgress);
  return results[0] || null;
}
