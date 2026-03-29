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

const buildHomepageMessage = ({ firstName, lastName, phone }) => {
  const fullName = `${firstName} ${lastName}`.trim();
  const normalizedPhone = normalizePhone(phone);

  return [
    `Homepage quick contact request from ${fullName}.`,
    "The lead wants to be contacted about available properties and investment opportunities.",
    normalizedPhone ? `Phone provided: ${normalizedPhone}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
};

const HomeContactStrip = () => {
  const { t } = useTranslation();
  const { validateLogin } = useAuthCheck();
  const { isAuthenticated } = useAuth0();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resumeState = consumePostLoginResume(
      (entry) =>
        entry?.type === "home-contact-strip" &&
        entry?.returnTo === buildCurrentReturnTo()
    );

    if (!resumeState?.formData) return;

    setFormData((prev) => ({
      ...prev,
      ...resumeState.formData,
    }));

    requestAnimationFrame(() => {
      document
        .getElementById("home-contact-form")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [isAuthenticated]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? "";
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      savePostLoginResume({
        type: "home-contact-strip",
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

    if (!formData.email.trim()) {
      toast.error(bilingualKey("contactModal.errorEmail"));
      return;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      toast.error(bilingualKey("contactModal.errorEmailInvalid"));
      return;
    }

    setLoading(true);

    try {
      await sendEmail({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        email: formData.email.trim(),
        phone: normalizePhone(formData.phone),
        subject: "Homepage Quick Contact",
        message: buildHomepageMessage(formData),
        leadSource: "homepage_quick_contact",
      });

      toast.success(bilingualKey("contactModal.successMessage"));
      setFormData(INITIAL_FORM);
    } catch (error) {
      toast.error(bilingualKey("contactModal.errorSending"));
      console.error("Error sending homepage contact form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="home-contact-form"
      className="relative z-20 bg-white px-0 pb-0 pt-4 sm:pt-5"
    >
      <div className="w-full px-0">
        <div className="overflow-hidden border border-[#ead9d4] bg-[#f4ede8]">
          <div className="flex flex-col xl:flex-row xl:items-center">
            <div className="flex items-center gap-4 border-b border-[#ead9d4] px-6 py-5 xl:w-[285px] xl:border-b-0">
              <div className="shrink-0 text-[#971b1e]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12 origin-center animate-[vibrate_2.4s_ease-in-out_infinite]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 16.2v1.9a1.7 1.7 0 0 1-1.86 1.7A16 16 0 0 1 4.2 4.86 1.7 1.7 0 0 1 5.9 3h1.9A1.7 1.7 0 0 1 9.4 4.15l.55 1.8a1.7 1.7 0 0 1-.39 1.72l-1.17 1.2a14.4 14.4 0 0 0 6.7 6.7l1.2-1.17a1.7 1.7 0 0 1 1.72-.39l1.8.55A1.7 1.7 0 0 1 21 16.2Z" />
                  <path d="M14.9 4.4a4.7 4.7 0 0 1 3.7 3.7" />
                  <path d="M14.9 1.8a7.3 7.3 0 0 1 6.1 6.1" />
                </svg>
              </div>

              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold uppercase tracking-[-0.01em] text-[#971b1e] sm:text-[18px]">
                  {t("homeContact.connectLabel", {
                    defaultValue: "Connect With HB",
                  })}
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 px-5 py-5 sm:px-6 xl:px-7">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(320px,1.35fr)_minmax(0,1.05fr)_275px]">
                <label className="block">
                  <span className="sr-only">
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
                    className="h-[45px] w-full rounded-[2px] border border-[#e4d5d0] bg-white px-4 text-[15px] font-medium text-[#971b1e] outline-none transition placeholder:font-semibold placeholder:uppercase placeholder:text-[#971b1e]/40 focus:border-[#971b1e]"
                  />
                </label>

                <label className="block">
                  <span className="sr-only">
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
                    className="h-[45px] w-full rounded-[2px] border border-[#e4d5d0] bg-white px-4 text-[15px] font-medium text-[#971b1e] outline-none transition placeholder:font-semibold placeholder:uppercase placeholder:text-[#971b1e]/40 focus:border-[#971b1e]"
                  />
                </label>

                <label className="block">
                  <span className="sr-only">
                    {t("contact.phone", { defaultValue: "Phone Number" })}
                  </span>
                  <div className="grid h-[45px] grid-cols-[54px_74px_minmax(0,1fr)] overflow-hidden rounded-[2px] border border-[#e4d5d0] bg-white transition focus-within:border-[#971b1e]">
                    <span className="flex h-full items-center justify-center bg-[#971b1e] text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
                      TR
                    </span>
                    <span className="flex h-full items-center justify-center border-r border-[#e4d5d0] text-[15px] font-medium text-[#971b1e]">
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
                      className="min-w-0 h-full w-full px-3 text-[14px] font-medium text-[#971b1e] outline-none placeholder:font-semibold placeholder:uppercase placeholder:text-[#971b1e]/40"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="sr-only">
                    {t("contact.email", { defaultValue: "Email Address" })}
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
                    className="h-[45px] w-full rounded-[2px] border border-[#e4d5d0] bg-white px-4 text-[15px] font-medium text-[#971b1e] outline-none transition placeholder:font-semibold placeholder:uppercase placeholder:text-[#971b1e]/40 focus:border-[#971b1e]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[45px] w-full items-center justify-center gap-3 rounded-[2px] bg-[#971b1e] px-5 text-[15px] font-semibold uppercase text-white transition hover:bg-[#7f1618] disabled:cursor-not-allowed disabled:opacity-70 xl:self-stretch"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  <span>
                    {loading
                      ? t("homeContact.sending", {
                          defaultValue: "Sending",
                        })
                      : t("homeContact.submit", {
                          defaultValue: "Contact",
                        })}
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 10h12" />
                    <path d="m10 4 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeContactStrip;
