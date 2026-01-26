import { useState, useContext } from "react";
import { Modal, TextInput, Textarea, Button, Group } from "@mantine/core";
import { toast } from "react-toastify";
import { sendEmail } from "../utils/api";
import { FaEnvelope, FaUser, FaPhone } from "react-icons/fa6";
import PropTypes from "prop-types";
import UserDetailContext from "../context/UserDetailContext";
import { useTranslation } from "react-i18next";
import useConsultants from "../hooks/useConsultants";

const ContactModal = ({ opened, onClose, propertyId, propertyTitle, userEmail }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === "tr" ? "tr" : "en";
  const { data: consultants = [], isLoading: consultantsLoading } = useConsultants();
  const [loading, setLoading] = useState(false);
  const [selectedConsultantId, setSelectedConsultantId] = useState(null);
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

  const handleClose = () => {
    setSelectedConsultantId(null);
    onClose();
  };

  const getLocalizedField = (consultant, field) => {
    const localizedKey = `${field}_${currentLang}`;
    return consultant?.[localizedKey] || consultant?.[field] || "";
  };

  const availableConsultants = Array.isArray(consultants)
    ? consultants.filter((c) => c.available !== false)
    : [];
  const selectedConsultant = availableConsultants.find(
    (c) => c.id === selectedConsultantId
  );

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
        consultantId: selectedConsultant?.id || null,
        consultantName: selectedConsultant?.name || null,
        consultantEmail: selectedConsultant?.email || null,
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
      setSelectedConsultantId(null);
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
      onClose={handleClose}
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

        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {t("contactModal.chooseConsultant")}
            </span>
            {selectedConsultant && (
              <button
                type="button"
                onClick={() => setSelectedConsultantId(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t("contactModal.clearSelection")}
              </button>
            )}
          </div>
          {consultantsLoading ? (
            <p className="mt-2 text-xs text-gray-400">{t("common.loading")}</p>
          ) : availableConsultants.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">
              {t("contactModal.noConsultants")}
            </p>
          ) : (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {availableConsultants.slice(0, 10).map((consultant) => {
                const isSelected = consultant.id === selectedConsultantId;
                return (
                  <button
                    key={consultant.id}
                    type="button"
                    onClick={() => setSelectedConsultantId(consultant.id)}
                    className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      <img
                        src={
                          consultant.image ||
                          "https://via.placeholder.com/80?text=Agent"
                        }
                        alt={consultant.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">
                        {consultant.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getLocalizedField(consultant, "title")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {selectedConsultant && (
            <p className="mt-2 text-xs text-gray-600">
              {t("contactModal.selectedConsultant")}:{" "}
              <span className="font-semibold text-gray-800">
                {selectedConsultant.name}
              </span>
            </p>
          )}
        </div>

        <Textarea
          label={t("contactModal.yourMessage")}
          placeholder={t("contactModal.messagePlaceholder")}
          required
          minRows={4}
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
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
