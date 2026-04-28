import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Loader,
  Select,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { toast } from "react-toastify";
import {
  createVideoUploadSession,
  getAdminVideos,
  updateAdminVideo,
} from "../../utils/api";

const STATUS_COLORS = {
  ready: "green",
  processing: "yellow",
  uploading: "blue",
  failed: "red",
};

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const VideoManagement = ({ token, properties = [] }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    type: "property",
    entityId: "",
    language: "en",
    isHeroVideo: false,
    playbackUrl: "",
    thumbnailUrl: "",
    duration: "",
  });

  const propertyOptions = useMemo(
    () =>
      (properties || [])
        .filter((item) => {
          const type = normalizeString(item?.propertyType).toLowerCase();
          return type && !["local-project", "international-project"].includes(type);
        })
        .map((item) => ({
          value: item.id,
          label: `${item.title} (${item.city || "Property"})`,
        })),
    [properties]
  );

  const projectOptions = useMemo(
    () =>
      (properties || [])
        .filter((item) =>
          ["local-project", "international-project"].includes(
            normalizeString(item?.propertyType).toLowerCase()
          )
        )
        .map((item) => ({
          value: item.id,
          label: `${item.title} (${item.city || "Project"})`,
        })),
    [properties]
  );

  const entityOptions = form.type === "project" ? projectOptions : propertyOptions;

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await getAdminVideos(token);
      setVideos(Array.isArray(response?.videos) ? response.videos : []);
    } catch (_error) {
      toast.error("Failed to load videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadVideos();
  }, [token]);

  const handleCreate = async () => {
    if (!form.title || !form.entityId) {
      toast.error("Title and property/project selection are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        propertyId: form.type === "property" ? form.entityId : "",
        projectId: form.type === "project" ? form.entityId : "",
        language: form.language,
        isHeroVideo: form.isHeroVideo,
        playbackUrl: form.playbackUrl,
        thumbnailUrl: form.thumbnailUrl,
        duration: form.duration,
        fileName: selectedFile?.name || "",
        mimeType: selectedFile?.type || "",
        fileSize: selectedFile?.size || 0,
      };
      const response = await createVideoUploadSession(payload, token);
      setVideos((current) => [response.video, ...current]);
      setForm({
        title: "",
        type: "property",
        entityId: "",
        language: "en",
        isHeroVideo: false,
        playbackUrl: "",
        thumbnailUrl: "",
        duration: "",
      });
      setSelectedFile(null);
      toast.success(
        response?.uploadSession?.manualUploadRequired
          ? "Video draft created. Add playback URL when the file is ready."
          : "Video upload session created."
      );
    } catch (_error) {
      toast.error("Failed to create video upload session.");
    } finally {
      setSaving(false);
    }
  };

  const handleVideoPatch = async (videoId, patch) => {
    try {
      const response = await updateAdminVideo(videoId, patch, token);
      setVideos((current) =>
        current.map((video) => (video.id === videoId ? response.video : video))
      );
      toast.success("Video updated.");
    } catch (_error) {
      toast.error("Failed to update video.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Text fw={700} size="lg">
              Video Lead Engine
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              Attach Vidmox-ready or manual playback videos to properties and projects.
            </Text>
          </div>
          <Button variant="default" onClick={loadVideos} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextInput
            label="Video title"
            placeholder="Luxury project walkthrough"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <Select
            label="Language"
            data={[
              { value: "en", label: "English" },
              { value: "tr", label: "Turkish" },
              { value: "ru", label: "Russian" },
            ]}
            value={form.language}
            onChange={(value) => setForm((current) => ({ ...current, language: value || "en" }))}
          />
          <Select
            label="Video type"
            data={[
              { value: "property", label: "Property" },
              { value: "project", label: "Project" },
            ]}
            value={form.type}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                type: value || "property",
                entityId: "",
              }))
            }
          />
          <Select
            label={form.type === "project" ? "Project" : "Property"}
            searchable
            data={entityOptions}
            value={form.entityId}
            onChange={(value) => setForm((current) => ({ ...current, entityId: value || "" }))}
          />
          <TextInput
            label="Manual playback URL"
            placeholder="https://..."
            value={form.playbackUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, playbackUrl: event.target.value }))
            }
          />
          <TextInput
            label="Thumbnail URL"
            placeholder="https://..."
            value={form.thumbnailUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, thumbnailUrl: event.target.value }))
            }
          />
          <TextInput
            label="Duration (seconds)"
            placeholder="120"
            value={form.duration}
            onChange={(event) =>
              setForm((current) => ({ ...current, duration: event.target.value }))
            }
          />
          <div className="space-y-2">
            <Text size="sm" fw={500}>
              Source video file
            </Text>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <Text size="xs" c="dimmed">
              File selection stores upload metadata now. If Vidmox API is not ready, save a playback URL manually after processing.
            </Text>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Switch
            label="Hero video"
            checked={form.isHeroVideo}
            onChange={(event) =>
              setForm((current) => ({ ...current, isHeroVideo: event.currentTarget.checked }))
            }
          />
          <Button onClick={handleCreate} loading={saving}>
            Create Video Entry
          </Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Text fw={700}>Existing Videos</Text>
          <Badge color="gray" variant="light">
            {videos.length} total
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : videos.length === 0 ? (
          <Text c="dimmed">No videos created yet.</Text>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Text fw={600}>{video.title}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {video.type} • {video.language.toUpperCase()} • {video.id}
                    </Text>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge color={STATUS_COLORS[video.status] || "gray"}>
                      {video.status}
                    </Badge>
                    {video.isHeroVideo ? <Badge color="teal">Hero</Badge> : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <TextInput
                    label="Playback URL"
                    value={video.playbackUrl || ""}
                    onChange={(event) =>
                      setVideos((current) =>
                        current.map((item) =>
                          item.id === video.id
                            ? { ...item, playbackUrl: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <TextInput
                    label="Thumbnail URL"
                    value={video.thumbnailUrl || ""}
                    onChange={(event) =>
                      setVideos((current) =>
                        current.map((item) =>
                          item.id === video.id
                            ? { ...item, thumbnailUrl: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      fullWidth
                      onClick={() =>
                        handleVideoPatch(video.id, {
                          playbackUrl: video.playbackUrl,
                          thumbnailUrl: video.thumbnailUrl,
                          status: video.playbackUrl ? "ready" : video.status,
                          isHeroVideo: video.isHeroVideo,
                        })
                      }
                    >
                      Save URLs
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Switch
                    label="Hero video"
                    checked={Boolean(video.isHeroVideo)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setVideos((current) =>
                        current.map((item) =>
                          item.id === video.id ? { ...item, isHeroVideo: checked } : item
                        )
                      );
                      handleVideoPatch(video.id, { isHeroVideo: checked });
                    }}
                  />
                  {video.playbackUrl ? (
                    <a
                      href={video.playbackUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-teal-700 underline"
                    >
                      Open playback URL
                    </a>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Playback URL not available yet.
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

VideoManagement.propTypes = {
  token: PropTypes.string,
  properties: PropTypes.arrayOf(PropTypes.object),
};

export default VideoManagement;
