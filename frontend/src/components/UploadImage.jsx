import { Button, Group } from "@mantine/core";
import { useContext, useRef, useState } from "react";
import { MdOutlineCloudUpload, MdPlayCircleOutline, MdVideocam } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import PropTypes from "prop-types";
import { uploadFiles, IMAGE_ACCEPT, VIDEO_ACCEPT } from "../utils/upload";
import UserDetailContext from "../context/UserDetailContext";
import { toast } from "react-toastify";

const ProgressBar = ({ progress, color = "blue" }) => {
  if (!progress) return null;
  const colors = {
    blue: { bar: "bg-blue-500", track: "bg-blue-100", text: "text-blue-700" },
    purple: { bar: "bg-purple-500", track: "bg-purple-100", text: "text-purple-700" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="w-full px-4">
      <div className={`w-full ${c.track} rounded-full h-3 overflow-hidden`}>
        <div
          className={`${c.bar} h-full rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className={`flex justify-between mt-1 text-xs ${c.text}`}>
        <span>{progress.percent}%</span>
        <span>{progress.loadedFormatted} / {progress.totalFormatted}</span>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.object,
  color: PropTypes.string,
};

const UploadImage = ({
  prevStep,
  nextStep,
  propertyDetails,
  setPropertyDetails,
}) => {
  const [imageURLs, setImageURLs] = useState(
    propertyDetails.images ||
      (propertyDetails.image ? [propertyDetails.image] : [])
  );
  const [videoURLs, setVideoURLs] = useState(propertyDetails.videos || []);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(null);
  const [videoProgress, setVideoProgress] = useState(null);
  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const {
    userDetails: { token },
  } = useContext(UserDetailContext);

  const handleNext = () => {
    setPropertyDetails((prev) => ({
      ...prev,
      images: imageURLs,
      image: imageURLs[0] || "",
      videos: videoURLs,
    }));
    nextStep();
  };

  const removeImage = (indexToRemove) => {
    setImageURLs((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeVideo = (indexToRemove) => {
    setVideoURLs((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleImageFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setImageUploading(true);
    setImageProgress(null);
    try {
      const results = await uploadFiles(files, token, "properties/images", (p) => setImageProgress(p));
      setImageURLs((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err) {
      toast.error("Image upload failed: " + err.message, { position: "bottom-right" });
    } finally {
      setImageUploading(false);
      setImageProgress(null);
      e.target.value = "";
    }
  };

  const handleVideoFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setVideoUploading(true);
    setVideoProgress(null);
    try {
      const results = await uploadFiles(files, token, "properties/videos", (p) => setVideoProgress(p));
      setVideoURLs((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err) {
      toast.error("Video upload failed: " + err.message, { position: "bottom-right" });
    } finally {
      setVideoUploading(false);
      setVideoProgress(null);
      e.target.value = "";
    }
  };

  return (
    <div className="mt-8 flex-col flexCenter">
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept={IMAGE_ACCEPT}
        multiple
        onChange={handleImageFiles}
      />
      <input
        type="file"
        ref={videoInputRef}
        style={{ display: "none" }}
        accept={VIDEO_ACCEPT}
        multiple
        onChange={handleVideoFiles}
      />

      {/* Combined Gallery Section - Images & Videos */}
      <div className="w-3/4 mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <MdOutlineCloudUpload size={24} />
          تصاویر و ویدیوها / Görseller ve Videolar
          {(imageURLs.length > 0 || videoURLs.length > 0) && (
            <span className="text-sm font-normal text-gray-500">
              ({imageURLs.length} resim{videoURLs.length > 0 ? `, ${videoURLs.length} video` : ''})
            </span>
          )}
        </h3>
        
        {imageURLs.length === 0 && videoURLs.length === 0 ? (
          <div className="flex gap-4">
            <div
              onClick={() => !imageUploading && imageInputRef.current?.click()}
              className={`flex-1 flexCenter flex-col h-[180px] border-dashed border-2 cursor-pointer rounded-xl hover:bg-gray-50 transition-colors ${imageUploading ? 'pointer-events-none' : ''}`}
            >
              {imageUploading ? (
                <div className="w-full flexCenter flex-col gap-2">
                  <MdOutlineCloudUpload size={36} className="text-blue-500 animate-pulse" />
                  <span className="text-blue-600 font-medium text-sm">در حال آپلود تصاویر...</span>
                  <ProgressBar progress={imageProgress} color="blue" />
                </div>
              ) : (
                <>
                  <MdOutlineCloudUpload size={44} color="grey" />
                  <span className="text-gray-600 mt-2">Upload Images (max 30)</span>
                  <span className="text-gray-400 text-sm">آپلود تصاویر</span>
                </>
              )}
            </div>
            <div
              onClick={() => !videoUploading && videoInputRef.current?.click()}
              className={`flex-1 flexCenter flex-col h-[180px] border-dashed border-2 border-purple-300 cursor-pointer rounded-xl hover:bg-purple-50 transition-colors ${videoUploading ? 'pointer-events-none' : ''}`}
            >
              {videoUploading ? (
                <div className="w-full flexCenter flex-col gap-2">
                  <MdVideocam size={36} className="text-purple-500 animate-pulse" />
                  <span className="text-purple-600 font-medium text-sm">در حال آپلود ویدیو...</span>
                  <ProgressBar progress={videoProgress} color="purple" />
                </div>
              ) : (
                <>
                  <MdVideocam size={44} color="#9333ea" />
                  <span className="text-purple-600 mt-2">Upload Videos (max 10)</span>
                  <span className="text-purple-400 text-sm">آپلود ویدیو</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Progress bars above grid when uploading */}
            {imageUploading && imageProgress && (
              <div className="mb-3 p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <MdOutlineCloudUpload size={18} className="text-blue-500 animate-pulse" />
                  <span className="text-blue-700 text-sm font-medium">در حال آپلود تصاویر...</span>
                </div>
                <ProgressBar progress={imageProgress} color="blue" />
              </div>
            )}
            {videoUploading && videoProgress && (
              <div className="mb-3 p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <MdVideocam size={18} className="text-purple-500 animate-pulse" />
                  <span className="text-purple-700 text-sm font-medium">در حال آپلود ویدیو...</span>
                </div>
                <ProgressBar progress={videoProgress} color="purple" />
              </div>
            )}

            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              }}
            >
              {/* Videos First */}
              {videoURLs.map((url, index) => (
                <div
                  key={`video-${index}`}
                  className="relative h-[150px] rounded-xl overflow-hidden group bg-gray-900"
                >
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    muted
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => {
                      e.target.pause();
                      e.target.currentTime = 0;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <MdPlayCircleOutline size={48} color="white" className="opacity-70" />
                  </div>
                  <button
                    onClick={() => removeVideo(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ lineHeight: 0 }}
                  >
                    <AiOutlineClose size={16} />
                  </button>
                  <span className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    Video {index + 1}
                  </span>
                </div>
              ))}
              
              {/* Images */}
              {imageURLs.map((url, index) => (
                <div
                  key={`image-${index}`}
                  className="relative h-[150px] rounded-xl overflow-hidden group"
                >
                  <img
                    src={url}
                    alt={`property-${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ lineHeight: 0 }}
                  >
                    <AiOutlineClose size={16} />
                  </button>
                  {index === 0 && videoURLs.length === 0 && (
                    <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Ana
                    </span>
                  )}
                </div>
              ))}
              
              {/* Add Image Button */}
              <div
                onClick={() => !imageUploading && imageInputRef.current?.click()}
                className={`flexCenter flex-col h-[150px] border-dashed border-2 rounded-xl cursor-pointer hover:bg-gray-50 ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <MdOutlineCloudUpload size={32} color="grey" />
                <span className="text-sm text-gray-500">Resim Ekle</span>
              </div>
              
              {/* Add Video Button */}
              <div
                onClick={() => !videoUploading && videoInputRef.current?.click()}
                className={`flexCenter flex-col h-[150px] border-dashed border-2 border-purple-300 rounded-xl cursor-pointer hover:bg-purple-50 ${videoUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <MdVideocam size={32} color="#9333ea" />
                <span className="text-sm text-purple-500">Video Ekle</span>
              </div>
            </div>
          </>
        )}
      </div>

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={imageURLs.length === 0 && videoURLs.length === 0}
        >
          Next
        </Button>
      </Group>
    </div>
  );
};

UploadImage.propTypes = {
  prevStep: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  propertyDetails: PropTypes.shape({
    images: PropTypes.arrayOf(PropTypes.string),
    image: PropTypes.string,
    videos: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  setPropertyDetails: PropTypes.func.isRequired,
};

export default UploadImage;
