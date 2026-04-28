import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { MdPlayArrow } from "react-icons/md";
import {
  buildVideoTrackingPayload,
  trackVideoEngagementEvent,
} from "../../utils/videoLeadTracking";

const WATCH_THRESHOLDS = [
  { percent: 25, eventType: "progress_25" },
  { percent: 50, eventType: "progress_50" },
  { percent: 75, eventType: "progress_75" },
  { percent: 90, eventType: "progress_90" },
];

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const getPlacementSource = (placement = "gallery") => `video_${placement}`;

const SmartPropertyVideo = ({
  video,
  propertyId = "",
  projectId = "",
  leadId = "",
  placement = "gallery",
  context = {},
  ctaMessage = "",
  ctaLabels = null,
  onWhatsAppClick,
  onSimilarPropertiesClick,
  onBookViewingClick,
  className = "",
  autoPlay = false,
}) => {
  const playerRef = useRef(null);
  const sentEventsRef = useRef(new Set());
  const [showPoster, setShowPoster] = useState(true);
  const [showSmartCta, setShowSmartCta] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const normalizedVideo = useMemo(() => {
    if (typeof video === "string") {
      return {
        id: video,
        playbackUrl: video,
        thumbnailUrl: "",
        title: "",
      };
    }
    return {
      id: normalizeString(video?.id || video?.videoId || video?.vidmoxVideoId),
      playbackUrl: normalizeString(video?.playbackUrl || video?.url),
      thumbnailUrl: normalizeString(video?.thumbnailUrl || video?.poster),
      title: normalizeString(video?.title),
    };
  }, [video]);

  const sendEvent = async (eventType, watchPercent = 0) => {
    const dedupeKey = `${normalizedVideo.id}:${eventType}`;
    if (sentEventsRef.current.has(dedupeKey)) return;
    sentEventsRef.current.add(dedupeKey);

    await trackVideoEngagementEvent(
      buildVideoTrackingPayload({
        videoId: normalizedVideo.id,
        leadId,
        propertyId,
        projectId,
        eventType,
        watchPercent,
        source: getPlacementSource(placement),
        context,
      })
    );
  };

  useEffect(() => {
    sentEventsRef.current.clear();
    setShowPoster(true);
    setShowSmartCta(false);
    setIsPlaying(false);
  }, [normalizedVideo.id]);

  const handlePlay = async () => {
    setShowPoster(false);
    setIsPlaying(true);
    await sendEvent("play", 0);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    setShowSmartCta(true);
    await sendEvent("completed", 100);
  };

  const handleTimeUpdate = async () => {
    const element = playerRef.current;
    if (!element || !element.duration) return;

    const watchPercent = Math.min(
      100,
      Math.round((element.currentTime / element.duration) * 100)
    );

    for (const threshold of WATCH_THRESHOLDS) {
      if (watchPercent >= threshold.percent) {
        await sendEvent(threshold.eventType, watchPercent);
      }
    }

    if (watchPercent > 60) {
      setShowSmartCta(true);
    }
  };

  if (!normalizedVideo.playbackUrl) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-[20px] border border-slate-200 bg-slate-950 ${className}`}>
      <div className="relative aspect-video w-full bg-slate-950">
        <video
          ref={playerRef}
          src={normalizedVideo.playbackUrl}
          poster={normalizedVideo.thumbnailUrl || undefined}
          className="h-full w-full object-cover"
          controls
          preload="metadata"
          playsInline
          autoPlay={autoPlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
        />

        {showPoster && normalizedVideo.thumbnailUrl ? (
          <button
            type="button"
            onClick={() => {
              playerRef.current?.play?.();
            }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/20"
            aria-label="Play video"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 text-slate-900 shadow-lg">
              <MdPlayArrow size={28} />
            </span>
          </button>
        ) : null}

        {!showPoster && isPlaying ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
            {placement.replace("_", " ")}
          </div>
        ) : null}
      </div>

      {showSmartCta && ctaMessage ? (
        <div className="space-y-3 border-t border-white/10 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-4 text-white">
          <p className="text-sm leading-6 text-slate-100">{ctaMessage}</p>
          <div className="flex flex-wrap gap-2">
            {onWhatsAppClick ? (
              <button
                type="button"
                onClick={onWhatsAppClick}
                className="rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#20bd5a]"
              >
                {ctaLabels?.whatsapp || "WhatsApp"}
              </button>
            ) : null}
            {onSimilarPropertiesClick ? (
              <button
                type="button"
                onClick={onSimilarPropertiesClick}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/16"
              >
                {ctaLabels?.similarProperties || "Similar Properties"}
              </button>
            ) : null}
            {onBookViewingClick ? (
              <button
                type="button"
                onClick={onBookViewingClick}
                className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/18"
              >
                {ctaLabels?.bookViewing || "Book Viewing"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

SmartPropertyVideo.propTypes = {
  video: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  propertyId: PropTypes.string,
  projectId: PropTypes.string,
  leadId: PropTypes.string,
  placement: PropTypes.oneOf(["hero", "gallery", "ai_assistant"]),
  context: PropTypes.object,
  ctaMessage: PropTypes.string,
  ctaLabels: PropTypes.shape({
    whatsapp: PropTypes.string,
    similarProperties: PropTypes.string,
    bookViewing: PropTypes.string,
  }),
  onWhatsAppClick: PropTypes.func,
  onSimilarPropertiesClick: PropTypes.func,
  onBookViewingClick: PropTypes.func,
  className: PropTypes.string,
  autoPlay: PropTypes.bool,
};

export default SmartPropertyVideo;
