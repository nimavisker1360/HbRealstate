import { api } from "./api";

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg,.heic,.heif,.avif,.ico";
const VIDEO_ACCEPT = ".mp4,.webm,.mov,.avi,.mkv,.m4v,.ogv,.3gp,.flv";

export async function uploadFileToBlob(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });

  return data.url;
}

export async function uploadFilesToBlob(files, onProgress) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const { data } = await api.post("/upload/multiple", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });

  return data.urls;
}

export function openFileDialog({ accept, multiple = false }) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept || "";
    input.multiple = multiple;
    input.onchange = () => resolve(Array.from(input.files));
    input.click();
  });
}

export async function pickAndUploadImages({ multiple = true, onProgress } = {}) {
  const files = await openFileDialog({
    accept: IMAGE_ACCEPT,
    multiple,
  });
  if (!files.length) return [];

  if (files.length === 1) {
    const url = await uploadFileToBlob(files[0], onProgress);
    return [url];
  }
  return uploadFilesToBlob(files, onProgress);
}

export async function pickAndUploadVideos({ multiple = true, onProgress } = {}) {
  const files = await openFileDialog({
    accept: VIDEO_ACCEPT,
    multiple,
  });
  if (!files.length) return [];

  if (files.length === 1) {
    const url = await uploadFileToBlob(files[0], onProgress);
    return [url];
  }
  return uploadFilesToBlob(files, onProgress);
}

export { IMAGE_ACCEPT, VIDEO_ACCEPT };
