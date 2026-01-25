import { useState, useContext, useEffect, useRef } from "react";
import {
  Modal,
  TextInput,
  Button,
  Avatar,
  Text,
  Group,
  ActionIcon,
  Divider,
} from "@mantine/core";
import { useAuth0 } from "@auth0/auth0-react";
import PropTypes from "prop-types";
import UserDetailContext from "../context/UserDetailContext";
import { getUserProfile, updateUserProfile } from "../utils/api";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  MdPerson,
  MdEmail,
  MdOutlineCloudUpload,
  MdClose,
  MdCheck,
  MdWarning,
  MdLocationOn,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa6";

const ProfileModal = ({ opened, setOpened }) => {
  const { t } = useTranslation();
  const { user } = useAuth0();
  const {
    userDetails: { token },
    setUserDetails,
  } = useContext(UserDetailContext);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
    phone: "",
    address: "",
  });
  const [profileComplete, setProfileComplete] = useState(false);

  // Cloudinary widget
  const cloudinaryRef = useRef();
  const widgetRef = useRef();

  // Helper function to build cropped Cloudinary URL
  const buildCroppedUrl = (info) => {
    const { secure_url, coordinates } = info;
    
    // If there are crop coordinates, apply them to the URL
    if (coordinates?.custom?.[0]) {
      const [x, y, width, height] = coordinates.custom[0];
      // Insert crop transformation into the URL
      const urlParts = secure_url.split('/upload/');
      if (urlParts.length === 2) {
        return `${urlParts[0]}/upload/c_crop,x_${Math.round(x)},y_${Math.round(y)},w_${Math.round(width)},h_${Math.round(height)}/${urlParts[1]}`;
      }
    }
    return secure_url;
  };

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    widgetRef.current = cloudinaryRef.current?.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ducct0j1f",
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "auvy3sl6",
        maxFiles: 1,
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        croppingCoordinatesMode: "custom",
        showSkipCropButton: false,
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
          const croppedUrl = buildCroppedUrl(result.info);
          setFormData((prev) => ({ ...prev, image: croppedUrl }));
          setImageUploading(false);
        }
        if (result.event === "close") {
          setImageUploading(false);
        }
      }
    );
  }, []);

  // Fetch user profile when modal opens
  useEffect(() => {
    const fetchProfile = async () => {
      if (opened && user?.email && token) {
        setLoading(true);
        try {
          const profile = await getUserProfile(user.email, token);
          if (profile) {
            setFormData({
              name: profile.name || user.name || "",
              email: profile.email || user.email || "",
              image: profile.image || user.picture || "",
              phone: profile.phone || "",
              address: profile.address || "",
            });
            setProfileComplete(profile.profileComplete || false);
          } else {
            // Use Auth0 user data as fallback
            setFormData({
              name: user.name || "",
              email: user.email || "",
              image: user.picture || "",
              phone: "",
              address: "",
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          // Use Auth0 user data as fallback
          setFormData({
            name: user.name || "",
            email: user.email || "",
            image: user.picture || "",
            phone: "",
            address: "",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [opened, user, token]);

  const openImageUpload = () => {
    setImageUploading(true);
    widgetRef.current?.open();
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.image ||
      !formData.phone ||
      !formData.address
    ) {
      toast.error(t("profile.fillAllFields"), { position: "bottom-right" });
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserProfile(
        {
          email: formData.email,
          name: formData.name,
          image: formData.image,
          phone: formData.phone,
          address: formData.address,
        },
        token
      );

      if (result.user) {
        setProfileComplete(result.user.profileComplete);
        setUserDetails((prev) => ({
          ...prev,
          profile: result.user,
        }));
        toast.success(t("profile.profileUpdated"), {
          position: "bottom-right",
        });
        setOpened(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const isFormComplete =
    formData.name && formData.image && formData.phone && formData.address;

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={
        <div className="flex items-center gap-2">
          <MdPerson className="text-secondary" size={24} />
          <Text fw={600} size="lg">
            {t("profile.myProfile")}
          </Text>
        </div>
      }
      size="md"
      centered
    >
      {loading ? (
        <div className="flexCenter py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </div>
      ) : (
        <div className="space-y-5 py-2">
          {/* Profile Status */}
          <div
            className={`p-3 rounded-lg flex items-center gap-3 ${
              profileComplete
                ? "bg-green-50 border border-green-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            {profileComplete ? (
              <>
                <div className="w-8 h-8 rounded-full bg-green-500 flexCenter">
                  <MdCheck className="text-white" size={18} />
                </div>
                <div>
                  <Text size="sm" fw={600} color="green">
                    {t("profile.profileCompleted")}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {t("profile.accessAllFeatures")}
                  </Text>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-amber-500 flexCenter">
                  <MdWarning className="text-white" size={18} />
                </div>
                <div>
                  <Text size="sm" fw={600} color="orange">
                    {t("profile.profileIncomplete")}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {t("profile.completeProfileToBook")}
                  </Text>
                </div>
              </>
            )}
          </div>

          <Divider />

          {/* Profile Image */}
          <div className="flexCenter flex-col gap-3">
            <Text size="sm" fw={500}>
              {t("profile.profilePhoto")} <span className="text-red-500">*</span>
            </Text>
            {formData.image ? (
              <div className="relative">
                <Avatar src={formData.image} size={120} radius={120} />
                <ActionIcon
                  variant="filled"
                  color="red"
                  size="sm"
                  radius="xl"
                  className="absolute top-0 right-0"
                  onClick={removeImage}
                >
                  <MdClose size={14} />
                </ActionIcon>
              </div>
            ) : (
              <div
                onClick={openImageUpload}
                className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flexCenter flex-col cursor-pointer hover:border-secondary hover:bg-gray-50 transition-colors"
              >
                <MdOutlineCloudUpload size={28} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">{t("profile.upload")}</span>
              </div>
            )}
            {formData.image && (
              <Button
                variant="subtle"
                size="xs"
                onClick={openImageUpload}
                loading={imageUploading}
              >
                {t("profile.change")}
              </Button>
            )}
          </div>

          {/* Form Fields */}
          <TextInput
            label={
              <span>
                {t("profile.fullName")} <span className="text-red-500">*</span>
              </span>
            }
            placeholder={t("profile.fullNamePlaceholder")}
            leftSection={<MdPerson size={18} />}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <TextInput
            label={t("profile.email")}
            placeholder={t("profile.emailPlaceholder")}
            leftSection={<MdEmail size={18} />}
            value={formData.email}
            disabled
            description={t("profile.emailCannotBeChanged")}
          />

          <TextInput
            label={
              <span>
                {t("profile.whatsapp")} <span className="text-red-500">*</span>
              </span>
            }
            placeholder={t("profile.whatsappPlaceholder")}
            leftSection={<FaWhatsapp size={18} className="text-green-500" />}
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <TextInput
            label={
              <span>
                {t("profile.address")} <span className="text-red-500">*</span>
              </span>
            }
            placeholder={t("profile.addressPlaceholder")}
            leftSection={<MdLocationOn size={18} />}
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />

          <Divider />

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              {t("profile.cancel")}
            </Button>
            <Button
              color="green"
              onClick={handleSave}
              loading={saving}
              disabled={!isFormComplete}
              leftSection={<MdCheck size={18} />}
            >
              {t("profile.save")}
            </Button>
          </Group>
        </div>
      )}
    </Modal>
  );
};

ProfileModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  setOpened: PropTypes.func.isRequired,
};

export default ProfileModal;
