import { Button, Group } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { MdOutlineCloudUpload, MdPlayCircleOutline, MdVideocam } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import PropTypes from "prop-types";

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
  const cloudinaryRef = useRef();
  const imageWidgetRef = useRef();
  const videoWidgetRef = useRef();

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

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    
    // Image upload widget
    imageWidgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 30,
        multiple: true,
        resourceType: "image",
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "bmp",
          "tiff",
          "svg",
          "heic",
          "heif",
          "avif",
          "ico",
          "raw",
        ],
        sources: ["local", "url", "camera"],
      },
      (err, result) => {
        if (result.event === "success") {
          setImageURLs((prev) => [...prev, result.info.secure_url]);
        }
      }
    );

    // Video upload widget
    videoWidgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 10,
        multiple: true,
        resourceType: "video",
        clientAllowedFormats: [
          "mp4",
          "webm",
          "mov",
          "avi",
          "mkv",
          "m4v",
          "ogv",
          "3gp",
          "flv",
        ],
        sources: ["local", "url", "camera"],
        maxFileSize: 104857600, // 100MB max file size for videos
      },
      (err, result) => {
        if (result.event === "success") {
          setVideoURLs((prev) => [...prev, result.info.secure_url]);
        }
      }
    );
  }, []);

  return (
    <div className="mt-8 flex-col flexCenter">
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
              onClick={() => imageWidgetRef.current?.open()}
              className="flex-1 flexCenter flex-col h-[180px] border-dashed border-2 cursor-pointer rounded-xl hover:bg-gray-50 transition-colors"
            >
              <MdOutlineCloudUpload size={44} color="grey" />
              <span className="text-gray-600 mt-2">Upload Images (max 30)</span>
              <span className="text-gray-400 text-sm">آپلود تصاویر</span>
            </div>
            <div
              onClick={() => videoWidgetRef.current?.open()}
              className="flex-1 flexCenter flex-col h-[180px] border-dashed border-2 border-purple-300 cursor-pointer rounded-xl hover:bg-purple-50 transition-colors"
            >
              <MdVideocam size={44} color="#9333ea" />
              <span className="text-purple-600 mt-2">Upload Videos (max 10)</span>
              <span className="text-purple-400 text-sm">آپلود ویدیو</span>
            </div>
          </div>
        ) : (
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
              onClick={() => imageWidgetRef.current?.open()}
              className="flexCenter flex-col h-[150px] border-dashed border-2 rounded-xl cursor-pointer hover:bg-gray-50"
            >
              <MdOutlineCloudUpload size={32} color="grey" />
              <span className="text-sm text-gray-500">Resim Ekle</span>
            </div>
            
            {/* Add Video Button */}
            <div
              onClick={() => videoWidgetRef.current?.open()}
              className="flexCenter flex-col h-[150px] border-dashed border-2 border-purple-300 rounded-xl cursor-pointer hover:bg-purple-50"
            >
              <MdVideocam size={32} color="#9333ea" />
              <span className="text-sm text-purple-500">Video Ekle</span>
            </div>
          </div>
        )}
      </div>

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={imageURLs.length === 0}>
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
