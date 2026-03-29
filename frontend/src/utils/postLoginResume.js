const POST_LOGIN_RESUME_KEY = "hb:post-login-resume";
const MAX_RESUME_AGE_MS = 30 * 60 * 1000;

export const buildCurrentReturnTo = () => {
  if (typeof window === "undefined") return "/";

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const readPostLoginResume = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.sessionStorage.getItem(POST_LOGIN_RESUME_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    const createdAt = Number(parsed?.createdAt || 0);

    if (!createdAt || Date.now() - createdAt > MAX_RESUME_AGE_MS) {
      window.sessionStorage.removeItem(POST_LOGIN_RESUME_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    window.sessionStorage.removeItem(POST_LOGIN_RESUME_KEY);
    return null;
  }
};

export const getPostLoginResume = () => readPostLoginResume();

export const savePostLoginResume = (payload = {}) => {
  if (typeof window === "undefined") return null;

  const nextValue = {
    ...payload,
    returnTo: payload.returnTo || buildCurrentReturnTo(),
    createdAt: Date.now(),
  };

  window.sessionStorage.setItem(
    POST_LOGIN_RESUME_KEY,
    JSON.stringify(nextValue)
  );

  return nextValue;
};

export const clearPostLoginResume = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(POST_LOGIN_RESUME_KEY);
};

export const consumePostLoginResume = (matcher) => {
  const resumeState = readPostLoginResume();
  if (!resumeState) return null;

  const matches =
    typeof matcher === "function"
      ? matcher(resumeState)
      : resumeState.type === matcher;

  if (!matches) return null;

  clearPostLoginResume();
  return resumeState;
};
