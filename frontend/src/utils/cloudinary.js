const normalizeEnvValue = (value) =>
  typeof value === "string" ? value.trim() : "";

export const CLOUDINARY_CLOUD_NAME = normalizeEnvValue(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
);

export const CLOUDINARY_UPLOAD_PRESET = normalizeEnvValue(
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
);

const missingEnvKeys = [
  !CLOUDINARY_CLOUD_NAME ? "VITE_CLOUDINARY_CLOUD_NAME" : null,
  !CLOUDINARY_UPLOAD_PRESET ? "VITE_CLOUDINARY_UPLOAD_PRESET" : null,
].filter(Boolean);

let hasWarnedAboutMissingCloudinaryConfig = false;

const warnMissingCloudinaryConfig = () => {
  if (hasWarnedAboutMissingCloudinaryConfig || missingEnvKeys.length === 0) return;

  hasWarnedAboutMissingCloudinaryConfig = true;
  console.warn(
    `[cloudinary] Missing ${missingEnvKeys.join(
      ", "
    )}. Upload widgets are disabled until frontend/.env is updated.`
  );
};

export const getCloudinaryWidgetConfig = (overrides = {}) => {
  if (missingEnvKeys.length > 0) {
    warnMissingCloudinaryConfig();
    return null;
  }

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    ...overrides,
  };
};
