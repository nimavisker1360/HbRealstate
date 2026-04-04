import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  MdArrowBack,
  MdArrowForward,
  MdCheckCircle,
  MdOutlinePhotoLibrary,
} from "react-icons/md";
import { createStagingRequestApi } from "../../utils/api";
import { pickAndUploadImages } from "../../utils/blobUpload";
import { PRIMARY_CONTACT_PHONE } from "../../constant/data";
import { normalizeWhatsAppNumber } from "../../utils/common";
import {
  STAGING_OWNER_TYPES,
  STAGING_PROPERTY_CONDITIONS,
  STAGING_FURNISHED,
  STAGING_TARGET_GOALS,
  STAGING_BUDGET_RANGES,
  STAGING_TIMELINES,
  STAGING_SERVICE_TYPES,
} from "../../constants/hbServicesOptions";

const inputClass =
  "w-full rounded-2xl border border-white/14 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/35 focus:border-[#06a84e] focus:outline-none focus:ring-2 focus:ring-[#06a84e]/30";
const labelClass = "mb-1.5 block text-sm font-medium text-white";
const helperTextClass = "mt-1.5 text-xs leading-relaxed text-white/55";
const errorTextClass = "mt-1.5 text-xs text-red-300";
const panelClass = "rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6";

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

const urlOk = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return true;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const mapPreferredLang = (lng) => {
  const l = String(lng || "en").slice(0, 2).toLowerCase();
  if (l === "tr") return "tr";
  if (l === "ru") return "ru";
  return "en";
};

const stepOneFields = ["fullName", "phone", "email"];

const StagingServiceForm = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth0();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    ownerType: "owner",
    propertyType: "",
    city: "",
    district: "",
    address: "",
    currentCondition: "",
    furnishedState: "",
    propertySize: "",
    roomCount: "",
    targetGoal: "",
    budgetRange: "",
    desiredTimeline: "",
    requestedServices: [],
    propertyUrl: "",
    notes: "",
    uploadedImages: [],
    consentContact: false,
    consentDataUse: false,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.name || "",
      email: current.email || user.email || "",
    }));
  }, [isAuthenticated, user]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    if (error) setError("");
  };

  const toggleService = (svc) => {
    setForm((current) => ({
      ...current,
      requestedServices: current.requestedServices.includes(svc)
        ? current.requestedServices.filter((service) => service !== svc)
        : [...current.requestedServices, svc],
    }));
  };

  const removeUploadedImage = (index) => {
    setForm((current) => ({
      ...current,
      uploadedImages: current.uploadedImages.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const buildStepOneErrors = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t("services.common.required");
    if (!form.phone.trim()) nextErrors.phone = t("services.common.required");
    if (!form.email.trim()) nextErrors.email = t("services.common.required");
    else if (!emailOk(form.email)) nextErrors.email = t("services.common.invalidEmail");
    return nextErrors;
  };

  const buildFormErrors = () => {
    const nextErrors = buildStepOneErrors();

    if (form.propertyUrl.trim() && !urlOk(form.propertyUrl)) {
      nextErrors.propertyUrl = tx("services.common.invalidUrl", "Please enter a valid URL.");
    }
    if (form.propertySize !== "" && Number(form.propertySize) <= 0) {
      nextErrors.propertySize = tx(
        "services.common.invalidPositiveNumber",
        "Please enter a valid positive number."
      );
    }
    if (!form.consentContact) {
      nextErrors.consentContact = t("services.common.consentRequired");
    }

    return nextErrors;
  };

  const handleContinue = () => {
    const nextErrors = buildStepOneErrors();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
      setError("");
    } else {
      setError(tx("services.common.fixHighlightedFields", "Please review the highlighted fields."));
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setError("");
    try {
      const urls = await pickAndUploadImages({ multiple: true });
      if (urls.length) {
        setForm((current) => ({
          ...current,
          uploadedImages: [...current.uploadedImages, ...urls],
        }));
      }
    } catch {
      setError(t("services.common.uploadFailed"));
    }
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();

    const nextErrors = buildFormErrors();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setError(tx("services.common.fixHighlightedFields", "Please review the highlighted fields."));
      setStep(Object.keys(nextErrors).some((key) => stepOneFields.includes(key)) ? 1 : 2);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        ownerType: form.ownerType,
        preferredLanguage: mapPreferredLang(i18n.language),
        propertyType: form.propertyType.trim() || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        address: form.address.trim() || undefined,
        currentCondition: form.currentCondition || undefined,
        furnishedState: form.furnishedState || undefined,
        propertySize: form.propertySize === "" ? undefined : Number(form.propertySize),
        roomCount: form.roomCount.trim() || undefined,
        targetGoal: form.targetGoal || undefined,
        budgetRange: form.budgetRange || undefined,
        budgetCurrency: "USD",
        desiredTimeline: form.desiredTimeline || undefined,
        requestedServices: form.requestedServices,
        propertyUrl: form.propertyUrl.trim() || undefined,
        notes: form.notes.trim() || undefined,
        uploadedImages: form.uploadedImages,
        consentContact: form.consentContact,
        consentDataUse: form.consentDataUse,
      };
      const res = await createStagingRequestApi(payload);
      if (res?.success !== false) setSuccess(true);
      else setError(res?.message || t("services.common.errorGeneric"));
    } catch (err) {
      const apiErrs = err?.response?.data?.errors;
      if (Array.isArray(apiErrs)) setError(apiErrs.join(", "));
      else setError(err?.response?.data?.message || t("services.common.errorGeneric"));
    }
    setLoading(false);
  };

  const waHref = `https://wa.me/${normalizeWhatsAppNumber(PRIMARY_CONTACT_PHONE)}`;

  if (success) {
    return (
      <div className="rounded-3xl border border-[#06a84e]/35 bg-[#06a84e]/10 p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#06a84e]/20 text-[#9cffbe]">
            <MdCheckCircle className="text-3xl" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">
            {t("services.common.successTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/82">
            {t("services.common.successBodyStaging")}
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold text-white">
                {tx("services.common.nextStepTitle", "What happens next")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {tx(
                  "services.staging.form.successNext",
                  "We review the goal, budget, and timeline first, then follow up with the most suitable next step."
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold text-white">
                {tx("services.staging.form.keepChatOpen", "Need to add references or links?")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {tx(
                  "services.staging.form.successWhatsAppHint",
                  "You can continue on WhatsApp if you want to share listing links, visual references, or updated priorities."
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#25D366] px-5 py-3 font-semibold text-white hover:opacity-95"
            >
              <FaWhatsapp className="shrink-0 text-xl" />
              {t("services.common.whatsappCta")}
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/20"
            >
              {t("services.common.backHome")}
            </a>
            {isAuthenticated && (
              <Link
                to="/my-staging-requests"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                {tx("services.staging.form.privatePanelCta", "Open my private request panel")}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className={panelClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
              {tx("services.staging.form.eyebrow", "Start with the goal")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {tx(
                "services.staging.form.introTitle",
                "Tell us what you want the property to achieve before we get into the details."
              )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/72">
              {tx(
                "services.staging.form.introBody",
                "Step one focuses on contact details, business intent, and scope. Property specifics can come after."
              )}
            </p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 self-start whitespace-nowrap rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 lg:self-auto"
          >
            <FaWhatsapp className="shrink-0 text-lg text-[#25D366]" />
            {t("services.common.whatsappQuick")}
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`rounded-2xl border p-4 text-left transition ${
            step === 1
              ? "border-[#06a84e]/45 bg-[#06a84e]/12"
              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9cffbe]">
            {tx("services.common.stepOne", "Step 1")}
          </span>
          <span className="mt-2 block text-base font-semibold text-white">
            {tx("services.staging.form.stepOneTitle", "Contact and commercial intent")}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-white/68">
            {tx(
              "services.staging.form.stepOneBody",
              "Share your goal, preferred budget range, timing, and any services you already know you want."
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => (step === 2 ? setStep(2) : handleContinue())}
          className={`rounded-2xl border p-4 text-left transition ${
            step === 2
              ? "border-[#06a84e]/45 bg-[#06a84e]/12"
              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9cffbe]">
            {tx("services.common.stepTwo", "Step 2")}
          </span>
          <span className="mt-2 block text-base font-semibold text-white">
            {tx("services.staging.form.stepTwoTitle", "Property details and final review")}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-white/68">
            {tx(
              "services.staging.form.stepTwoBody",
              "Add asset details, notes, photos, and the final consent before you send."
            )}
          </span>
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <>
          <div className={panelClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.staging.form.contactTitle", "Who should we contact?")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.staging.form.contactBody",
                  "Use the best contact details for quick follow-up, budget clarification, and scheduling."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.staging.form.fullName")} *</label>
                <input
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  placeholder={tx("services.staging.form.fullNamePlaceholder", "Your full name")}
                />
                {fieldErrors.fullName ? (
                  <p className={errorTextClass}>{fieldErrors.fullName}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.fullNameHelper",
                      "We will use this name when confirming the project brief."
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.phone")} *</label>
                <input
                  className={inputClass}
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder={tx("services.staging.form.phonePlaceholder", "+90 5XX XXX XXXX")}
                />
                {fieldErrors.phone ? (
                  <p className={errorTextClass}>{fieldErrors.phone}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.phoneHelper",
                      "Best for same-day follow-up if the brief is time-sensitive."
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.email")} *</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder={tx("services.staging.form.emailPlaceholder", "name@example.com")}
                />
                {fieldErrors.email ? (
                  <p className={errorTextClass}>{fieldErrors.email}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.emailHelper",
                      "Useful if we need to send a written summary, package suggestion, or follow-up."
                    )}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.staging.form.whatsapp")}</label>
                <input
                  className={inputClass}
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  placeholder={t("services.staging.form.whatsappHint")}
                />
                <p className={helperTextClass}>
                  {tx(
                    "services.staging.form.whatsappHelper",
                    "Optional. Useful for fast coordination, moodboard links, and visual references."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.staging.form.intentTitle", "Project intent")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.staging.form.intentBody",
                  "Start with the commercial goal and the rough scope. That helps us respond with a more useful first recommendation."
                )}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-white">{t("services.staging.form.ownerType")}</p>
                <p className={helperTextClass}>
                  {tx(
                    "services.staging.form.ownerTypeHelper",
                    "Choose the role that best matches your involvement in the asset."
                  )}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {STAGING_OWNER_TYPES.map((value) => {
                    const selected = form.ownerType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("ownerType", value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-[#06a84e]/55 bg-[#06a84e]/14 text-white"
                            : "border-white/12 bg-white/[0.02] text-green-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-semibold">
                          {t(`services.enums.staging.ownerType.${value}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">{t("services.staging.form.targetGoal")}</p>
                <p className={helperTextClass}>
                  {tx(
                    "services.staging.form.targetGoalHelper",
                    "Optional, but helpful if the brief is tied to a sale, rental, or portfolio decision."
                  )}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {STAGING_TARGET_GOALS.map((value) => {
                    const selected = form.targetGoal === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("targetGoal", value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-[#06a84e]/55 bg-[#06a84e]/14 text-white"
                            : "border-white/12 bg-white/[0.02] text-green-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-semibold">
                          {t(`services.enums.staging.targetGoal.${value}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("services.staging.form.budgetRange")}</label>
                  <select
                    className={inputClass}
                    value={form.budgetRange}
                    onChange={(e) => setField("budgetRange", e.target.value)}
                  >
                    <option value="" className="bg-slate-900">
                      {t("services.common.selectOptional")}
                    </option>
                    {STAGING_BUDGET_RANGES.map((value) => (
                      <option key={value} value={value} className="bg-slate-900">
                        {t(`services.enums.staging.budget.${value}`)}
                      </option>
                    ))}
                  </select>
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.budgetHelper",
                      "Optional. A rough budget helps us suggest a more realistic first scope."
                    )}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>{t("services.staging.form.timeline")}</label>
                  <select
                    className={inputClass}
                    value={form.desiredTimeline}
                    onChange={(e) => setField("desiredTimeline", e.target.value)}
                  >
                    <option value="" className="bg-slate-900">
                      {t("services.common.selectOptional")}
                    </option>
                    {STAGING_TIMELINES.map((value) => (
                      <option key={value} value={value} className="bg-slate-900">
                        {t(`services.enums.staging.timeline.${value}`)}
                      </option>
                    ))}
                  </select>
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.timelineHelper",
                      "Optional. Useful if the property needs to be market-ready on a specific schedule."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">{t("services.staging.form.services")}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.staging.form.servicesHelper",
                  "Select every service you already expect to need. You can leave this broad if you want guidance."
                )}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {STAGING_SERVICE_TYPES.map((value) => {
                const selected = form.requestedServices.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleService(value)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? "border-[#06a84e]/55 bg-[#06a84e]/14 text-white"
                        : "border-white/12 bg-white/[0.02] text-green-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="font-semibold">
                      {t(`services.enums.staging.service.${value}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-white/62">
              {tx(
                "services.staging.form.continueHint",
                "Next you can add property details, notes, photos, and the final consent."
              )}
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white transition hover:bg-[#059944]"
            >
              {tx("services.common.continue", "Continue")}
              <MdArrowForward className="text-lg" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {tx("services.staging.form.propertyStepTitle", "Property details and final review")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/68">
                  {tx(
                    "services.staging.form.propertyStepBody",
                    "Add the asset details you already know. The brief can still be submitted even if some items stay blank."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#9cffbe] transition hover:text-white sm:self-auto"
              >
                <MdArrowBack className="text-lg" />
                {tx("services.common.backToStepOne", "Back to step 1")}
              </button>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.staging.form.propertyBasicsTitle", "Property basics")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.staging.form.propertyBasicsBody",
                  "Location and asset details help us judge what kind of scope is realistic."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("services.staging.form.propertyType")}</label>
                <input
                  className={inputClass}
                  value={form.propertyType}
                  onChange={(e) => setField("propertyType", e.target.value)}
                  placeholder={tx(
                    "services.staging.form.propertyTypePlaceholder",
                    "Apartment, villa, office..."
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.city")}</label>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder={tx("services.staging.form.cityPlaceholder", "City")}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.district")}</label>
                <input
                  className={inputClass}
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                  placeholder={tx(
                    "services.staging.form.districtPlaceholder",
                    "District or neighborhood"
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.roomCount")}</label>
                <input
                  className={inputClass}
                  value={form.roomCount}
                  onChange={(e) => setField("roomCount", e.target.value)}
                  placeholder={tx(
                    "services.staging.form.roomCountPlaceholder",
                    "2+1, 3 bedrooms, studio..."
                  )}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.staging.form.address")}</label>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder={tx(
                    "services.staging.form.addressPlaceholder",
                    "Full address, building name, or landmark"
                  )}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.staging.form.propertyUrl")}</label>
                <input
                  className={inputClass}
                  value={form.propertyUrl}
                  onChange={(e) => setField("propertyUrl", e.target.value)}
                  placeholder={tx(
                    "services.staging.form.propertyUrlPlaceholder",
                    "https://example.com/listing"
                  )}
                />
                {fieldErrors.propertyUrl ? (
                  <p className={errorTextClass}>{fieldErrors.propertyUrl}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.propertyUrlHelper",
                      "Optional. Paste the listing link if the property is already live."
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.staging.form.assetStateTitle", "Asset condition and notes")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.staging.form.assetStateBody",
                  "This section helps us understand whether the work is more about styling, upgrades, or both."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("services.staging.form.condition")}</label>
                <select
                  className={inputClass}
                  value={form.currentCondition}
                  onChange={(e) => setField("currentCondition", e.target.value)}
                >
                  <option value="" className="bg-slate-900">
                    {t("services.common.selectOptional")}
                  </option>
                  {STAGING_PROPERTY_CONDITIONS.map((value) => (
                    <option key={value} value={value} className="bg-slate-900">
                      {t(`services.enums.staging.condition.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.furnished")}</label>
                <select
                  className={inputClass}
                  value={form.furnishedState}
                  onChange={(e) => setField("furnishedState", e.target.value)}
                >
                  <option value="" className="bg-slate-900">
                    {t("services.common.selectOptional")}
                  </option>
                  {STAGING_FURNISHED.map((value) => (
                    <option key={value} value={value} className="bg-slate-900">
                      {t(`services.enums.staging.furnished.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("services.staging.form.propertySize")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={inputClass}
                  value={form.propertySize}
                  onChange={(e) => setField("propertySize", e.target.value)}
                  placeholder={tx("services.staging.form.propertySizePlaceholder", "m2")}
                />
                {fieldErrors.propertySize ? (
                  <p className={errorTextClass}>{fieldErrors.propertySize}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.staging.form.propertySizeHelper",
                      "Optional. Size helps us judge how broad the staging or renovation scope may need to be."
                    )}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.staging.form.notes")}</label>
                <textarea
                  rows={6}
                  className={`${inputClass} min-h-[170px]`}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder={tx(
                    "services.staging.form.notesPlaceholder",
                    "Add anything that matters for the brief: existing issues, target buyer or tenant, listing deadline, or the areas that most need improvement."
                  )}
                />
                <p className={helperTextClass}>
                  {tx(
                    "services.staging.form.notesHelper",
                    "Optional. This is the best place to mention buyer profile, listing deadline, weak rooms, or any non-negotiables."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-white">
                  <MdOutlinePhotoLibrary className="text-xl text-[#9cffbe]" />
                  <p className="font-semibold">{t("services.staging.form.photos")}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-white/68">
                  {tx(
                    "services.staging.form.photosHelper",
                    "Optional. A few current photos help us estimate whether the first step is styling, light renovation, content production, or a mix."
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || loading}
                  className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  {uploading ? t("services.common.uploading") : t("services.common.addPhotos")}
                </button>

                {form.uploadedImages.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.uploadedImages.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                      >
                        <img
                          src={url}
                          alt={`${tx("services.common.file", "File")} ${index + 1}`}
                          className="h-24 w-full object-cover"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-900"
                        >
                          {tx("services.common.remove", "Remove")}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-white/45">
                    {tx(
                      "services.staging.form.noPhotosYet",
                      "No photos added yet. You can still send the brief without them."
                    )}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {tx("services.common.finalChecks", "Final checks")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/68">
                    {tx(
                      "services.staging.form.finalChecksBody",
                      "Confirm that we can contact you about this brief. Marketing consent stays optional."
                    )}
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consentContact}
                      onChange={(e) => setField("consentContact", e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm leading-relaxed text-green-300">
                      {t("services.staging.form.consentContact")}
                    </span>
                  </label>
                  {fieldErrors.consentContact ? (
                    <p className={errorTextClass}>{fieldErrors.consentContact}</p>
                  ) : null}

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consentDataUse}
                      onChange={(e) => setField("consentDataUse", e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm leading-relaxed text-green-300">
                      {t("services.staging.form.consentMarketing")}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 px-5 py-3 font-semibold text-white transition hover:bg-white/8 sm:w-auto"
            >
              <MdArrowBack className="text-lg" />
              {tx("services.common.back", "Back")}
            </button>

            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-bold text-white transition hover:bg-[#059944] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? t("services.common.sending")
                : uploading
                  ? tx("services.common.waitForUpload", "Finish photo upload first")
                  : t("services.common.submitRequest")}
            </button>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8 sm:w-auto"
            >
              <FaWhatsapp className="shrink-0 text-lg text-[#25D366]" />
              {t("services.common.whatsappQuick")}
            </a>
          </div>
        </>
      )}
    </form>
  );
};

export default StagingServiceForm;
