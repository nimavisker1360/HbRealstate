export const LIVE_STREAM_REQUEST_EVENT = "hb:open-live-stream";

export const requestLiveStream = (detail = {}) => {
  if (typeof window === "undefined") return false;

  window.dispatchEvent(
    new CustomEvent(LIVE_STREAM_REQUEST_EVENT, {
      detail,
    })
  );

  return true;
};
