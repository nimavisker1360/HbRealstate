export const LOGIN_MODAL_REQUEST_EVENT = "hb:open-login-modal";

export const requestLoginModal = (detail = {}) => {
  if (typeof window === "undefined") return false;

  window.dispatchEvent(
    new CustomEvent(LOGIN_MODAL_REQUEST_EVENT, {
      detail,
    })
  );

  return true;
};
