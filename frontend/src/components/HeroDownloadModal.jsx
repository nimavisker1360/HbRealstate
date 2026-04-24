import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { bilingualKey } from "../utils/bilingualToast";
import { sendEmail } from "../utils/api";
import useAuthCheck from "../hooks/useAuthCheck";
import { useAuth0 } from "@auth0/auth0-react";
import {
  buildCurrentReturnTo,
  consumePostLoginResume,
  savePostLoginResume,
} from "../utils/postLoginResume";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
};

const normalizePhone = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("+") ? trimmed : `+90 ${trimmed}`;
};

const buildGuideMessage = ({ firstName, lastName, phone, email }) => {
  const fullName = `${firstName} ${lastName}`.trim();
  const normalizedPhone = normalizePhone(phone);

  return [
    `Buyer guide download request from ${fullName}.`,
    `Email provided: ${email}.`,
    normalizedPhone ? `Phone provided: ${normalizedPhone}.` : null,
    "The lead wants to receive the buyer guide and additional investment details.",
  ]
    .filter(Boolean)
    .join(" ");
};

const HeroDownloadModal = ({ opened, onClose }) => {
  const { t } = useTranslation();
  const { validateLogin } = useAuthCheck();
  const { isAuthenticated, isLoading } = useAuth0();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opened || isLoading || !isAuthenticated) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthenticated, isLoading, loading, onClose, opened]);

  useEffect(() => {
    if (!opened || isLoading || !isAuthenticated) return;

    const resumeState = consumePostLoginResume(
      (entry) =>
        entry?.type === "hero-download" &&
        entry?.returnTo === buildCurrentReturnTo()
    );

    if (!resumeState?.formData) return;

    setFormData((prev) => ({
      ...prev,
      ...resumeState.formData,
    }));
  }, [isAuthenticated, isLoading, opened]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? "";
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      savePostLoginResume({
        type: "hero-download",
        formData,
        returnTo: buildCurrentReturnTo(),
      });
      validateLogin({ openModal: true });
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error(bilingualKey("contactModal.errorName"));
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      toast.error(
        t("contactModal.errorContact", {
          defaultValue: "Please enter your email address or phone number",
        })
      );
      return;
    }

    if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) {
      toast.error(bilingualKey("contactModal.errorEmailInvalid"));
      return;
    }

    setLoading(true);

    try {
      await sendEmail({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        email: formData.email.trim(),
        phone: normalizePhone(formData.phone),
        subject: "Buyer Guide Download Request",
        message: buildGuideMessage(formData),
        leadSource: "hero_guide_download",
      });

      toast.success(bilingualKey("contactModal.successMessage"));
      setFormData(INITIAL_FORM);
      onClose();
    } catch (error) {
      toast.error(bilingualKey("contactModal.errorSending"));
      console.error("Error sending hero download form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!opened || isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-md"
      onClick={() => !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-download-modal-title"
        className="relative w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,248,246,0.98)_0%,rgba(244,237,232,0.98)_100%)] shadow-[0_45px_120px_-45px_rgba(15,23,42,0.85)] animate-hero-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#971b1e]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#971b1e]/10 blur-3xl" />

        <div className="relative border-b border-[#ead9d4] px-6 pb-5 pt-6 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c1bb] bg-white/80 text-[#971b1e] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={t("common.close", { defaultValue: "Close" })}
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <span className="inline-flex rounded-full border border-[#cfa49d] bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#971b1e]">
            HB International
          </span>
          <h2
            id="hero-download-modal-title"
            className="mt-4 max-w-[420px] text-[28px] font-bold leading-tight text-[#7f1618] sm:text-[34px]"
          >
            {t("buyerGuideMenu.downloadCompleteBuyerGuide", {
              defaultValue: "Download Complete Buyer Guide",
            })}
          </h2>
          <p className="mt-3 max-w-[460px] text-sm leading-6 text-[#7d5f58] sm:text-[15px]">
            {t("hero.downloadModalDescription", {
              defaultValue:
                "Fill in your details and our team will send you the buyer guide and follow-up investment information.",
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#971b1e]">
                {t("homeContact.firstName", { defaultValue: "First Name" })}
              </span>
              <input
                type="text"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                placeholder={t("homeContact.firstName", {
                  defaultValue: "First Name",
                })}
                autoComplete="given-name"
                className="h-[50px] w-full rounded-xl border border-[#e2cfca] bg-white/95 px-4 text-[15px] font-medium text-[#6b1a1c] outline-none transition placeholder:text-[#971b1e]/35 focus:border-[#971b1e]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#971b1e]">
                {t("homeContact.lastName", { defaultValue: "Surname" })}
              </span>
              <input
                type="text"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                placeholder={t("homeContact.lastName", {
                  defaultValue: "Surname",
                })}
                autoComplete="family-name"
                className="h-[50px] w-full rounded-xl border border-[#e2cfca] bg-white/95 px-4 text-[15px] font-medium text-[#6b1a1c] outline-none transition placeholder:text-[#971b1e]/35 focus:border-[#971b1e]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#971b1e]">
                {t("contact.phone", { defaultValue: "Phone Number" })}
              </span>
              <div className="grid h-[50px] grid-cols-[56px_76px_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#e2cfca] bg-white/95 transition focus-within:border-[#971b1e]">
                <span className="flex items-center justify-center bg-[#971b1e] text-[12px] font-bold uppercase tracking-[0.08em] text-white">
                  TR
                </span>
                <span className="flex items-center justify-center border-r border-[#e2cfca] text-[15px] font-semibold text-[#971b1e]">
                  +90
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  placeholder={t("contact.phone", {
                    defaultValue: "Phone Number",
                  })}
                  autoComplete="tel-national"
                  inputMode="tel"
                  className="min-w-0 px-3 text-[14px] font-medium text-[#6b1a1c] outline-none placeholder:text-[#971b1e]/35"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#971b1e]">
                {t("contact.email", { defaultValue: "Email" })}
              </span>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder={t("contact.email", {
                  defaultValue: "Email",
                })}
                autoComplete="email"
                inputMode="email"
                className="h-[50px] w-full rounded-xl border border-[#e2cfca] bg-white/95 px-4 text-[15px] font-medium text-[#6b1a1c] outline-none transition placeholder:text-[#971b1e]/35 focus:border-[#971b1e]"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#8f6f67] sm:max-w-[260px]">
              {t("hero.downloadModalFootnote", {
                defaultValue:
                  "By submitting this form, you agree that our team may contact you about the guide and suitable investment opportunities.",
              })}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[54px] min-w-[220px] items-center justify-center gap-3 rounded-[12px] border border-[#7e1716] bg-[#a2211d] px-7 text-[15px] font-extrabold uppercase tracking-[0.05em] text-white shadow-[0_14px_30px_rgba(76,8,8,0.32),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[#8e1d1a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : null}
              <span>
                {loading
                  ? t("homeContact.sending", { defaultValue: "Sending" })
                  : t("hero.downloadNow", {
                      defaultValue: "Download Now",
                    })}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HeroDownloadModal;
