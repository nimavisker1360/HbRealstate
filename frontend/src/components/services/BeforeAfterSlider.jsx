import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const clampPercentage = (value) => Math.max(0, Math.min(100, value));

const BeforeAfterSlider = ({
  beforeUrl,
  afterUrl,
  className = "",
  aspectRatio = "16 / 10",
  beforeAlt = "",
  afterAlt = "",
}) => {
  const { t } = useTranslation();
  const [pct, setPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const frameRef = useRef(null);

  if (!beforeUrl || !afterUrl) return null;

  const updateFromClientX = (clientX) => {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds || !bounds.width) return;

    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setPct(clampPercentage(next));
  };

  const handlePointerDown = (event) => {
    setIsDragging(true);
    updateFromClientX(event.clientX);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    updateFromClientX(event.clientX);
  };

  const handlePointerUp = (event) => {
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[1.75rem] border border-white/12 bg-black/20 shadow-[0_20px_70px_rgba(0,0,0,0.35)] ${
        isFocused ? "ring-2 ring-white/30 ring-offset-0" : ""
      } ${className}`.trim()}
    >
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-[#08111b]"
        style={{ aspectRatio }}
      >
        <img
          src={afterUrl}
          alt={afterAlt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        >
          <img
            src={beforeUrl}
            alt={beforeAlt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/88 backdrop-blur">
          {t("services.staging.showcase.before")}
        </div>
        <div className="absolute right-4 top-4 z-20 rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/88 backdrop-blur">
          {t("services.staging.showcase.after")}
        </div>
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] text-white/70 backdrop-blur">
          {t("services.staging.showcase.dragHint")}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
        >
          <div className="relative h-full w-px bg-white/80 shadow-[0_0_24px_rgba(255,255,255,0.22)]">
            <div
              className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/92 text-slate-900 shadow-[0_16px_44px_rgba(0,0,0,0.4)] transition-transform duration-200 ${
                isDragging || isFocused ? "scale-105" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 7 3 12l5 5" />
                <path d="M16 7l5 5-5 5" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 z-30 cursor-ew-resize touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(event) => setPct(clampPercentage(Number(event.target.value)))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="sr-only"
          aria-label={t("services.staging.showcase.sliderAria")}
        />
      </div>
    </div>
  );
};

BeforeAfterSlider.propTypes = {
  beforeUrl: PropTypes.string,
  afterUrl: PropTypes.string,
  className: PropTypes.string,
  aspectRatio: PropTypes.string,
  beforeAlt: PropTypes.string,
  afterAlt: PropTypes.string,
};

export default BeforeAfterSlider;
