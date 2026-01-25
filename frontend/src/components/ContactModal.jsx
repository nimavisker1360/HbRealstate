import { useState, useContext } from "react";
import { Modal, TextInput, Textarea, Button, Group } from "@mantine/core";
import { toast } from "react-toastify";
import { sendEmail } from "../utils/api";
import { FaEnvelope, FaUser, FaPhone } from "react-icons/fa6";
import PropTypes from "prop-types";
import UserDetailContext from "../context/UserDetailContext";
import { useTranslation } from "react-i18next";

const ContactModal = ({ opened, onClose, propertyId, propertyTitle, userEmail }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const {
    userDetails: { bookings },
  } = useContext(UserDetailContext);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error(t("contactModal.errorName"));
      return;
    }
    if (!formData.email.trim()) {
      toast.error(t("contactModal.errorEmail"));
      return;
    }
    if (!formData.message.trim()) {
      toast.error(t("contactModal.errorMessage"));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t("contactModal.errorEmailInvalid"));
      return;
    }

    setLoading(true);
    try {
      const emailDataToSend = {
        ...formData,
        subject: formData.subject || t("contactModal.subjectDefault"),
        propertyId: propertyId || null,
        propertyTitle: propertyTitle || null,
      };
      
      await sendEmail(emailDataToSend);
      toast.success(t("contactModal.successMessage"));
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      onClose();
    } catch (error) {
      toast.error(t("contactModal.errorSending"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FaEnvelope className="text-secondary" />
          <span className="font-semibold">{t("contactModal.title")}</span>
        </div>
      }
      centered
      size="md"
      radius="lg"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="space-y-4">
        <TextInput
          label={t("contactModal.yourName")}
          placeholder={t("contactModal.namePlaceholder")}
          required
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          leftSection={<FaUser className="text-gray-400" />}
        />

        <TextInput
          label={t("contactModal.emailAddress")}
          placeholder={t("contactModal.emailPlaceholder")}
          required
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          leftSection={<FaEnvelope className="text-gray-400" />}
        />

        <TextInput
          label={t("contactModal.phoneNumber")}
          placeholder={t("contactModal.phonePlaceholder")}
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          leftSection={<FaPhone className="text-gray-400" />}
        />

        <TextInput
          label={t("contactModal.subject")}
          placeholder={t("contactModal.subjectPlaceholder")}
          value={formData.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
        />

        <Textarea
          label={t("contactModal.yourMessage")}
          placeholder={t("contactModal.messagePlaceholder")}
          required
          minRows={4}
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            {t("contactModal.cancel")}
          </Button>
          <Button
            color="green"
            onClick={handleSubmit}
            loading={loading}
            leftSection={<FaEnvelope />}
          >
            {t("contactModal.sendMessage")}
          </Button>
        </Group>
      </div>
    </Modal>
  );
};

ContactModal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  propertyId: PropTypes.string,
  propertyTitle: PropTypes.string,
  userEmail: PropTypes.string,
};

export default ContactModal;
