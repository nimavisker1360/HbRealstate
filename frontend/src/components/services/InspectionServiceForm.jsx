import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaWhatsapp } from "react-icons/fa";
import {
  MdArrowBack,
  MdArrowForward,
  MdCheckCircle,
  MdOutlinePhotoLibrary,
} from "react-icons/md";
import { createInspectionRequest } from "../../utils/api";
import { pickAndUploadImages } from "../../utils/blobUpload";
import { PRIMARY_CONTACT_PHONE } from "../../constant/data";
import { normalizeWhatsAppNumber } from "../../utils/common";
import {
  INSPECTION_REQUESTER_TYPES,
  INSPECTION_REQUEST_TYPES,
  INSPECTION_URGENCY,
  INSPECTION_OCCUPANCY,
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
const INSPECTION_PROPERTY_TYPES = [
  ["apartment", "Apartment"],
  ["villa", "Villa"],
  ["office", "Office"],
  ["commercial", "Commercial"],
  ["land", "Land"],
  ["building", "Building"],
];

const InspectionServiceForm = () => {
  const { t, i18n } = useTranslation();
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
    requesterType: "owner",
    propertyType: "",
    city: "",
    district: "",
    address: "",
    propertyUrl: "",
    referenceCode: "",
    grossArea: "",
    netArea: "",
    buildingAge: "",
    floorNumber: "",
    totalFloors: "",
    occupancyStatus: "",
    requestType: "standard",
    urgency: "normal",
    notes: "",
    uploadedImages: [],
    consentContact: false,
    consentDataUse: false,
  });

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
    if (form.grossArea !== "" && Number(form.grossArea) <= 0) {
      nextErrors.grossArea = tx(
        "services.common.invalidPositiveNumber",
        "Please enter a valid positive number."
      );
    }
    if (form.netArea !== "" && Number(form.netArea) <= 0) {
      nextErrors.netArea = tx(
        "services.common.invalidPositiveNumber",
        "Please enter a valid positive number."
      );
    }
    if (form.buildingAge !== "" && Number(form.buildingAge) < 0) {
      nextErrors.buildingAge = tx(
        "services.common.invalidNonNegativeNumber",
        "Please enter zero or a positive number."
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
        requesterType: form.requesterType,
        preferredLanguage: mapPreferredLang(i18n.language),
        propertyType: form.propertyType.trim() || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        address: form.address.trim() || undefined,
        propertyUrl: form.propertyUrl.trim() || undefined,
        referenceCode: form.referenceCode.trim() || undefined,
        grossArea: form.grossArea === "" ? undefined : Number(form.grossArea),
        netArea: form.netArea === "" ? undefined : Number(form.netArea),
        buildingAge: form.buildingAge === "" ? undefined : parseInt(form.buildingAge, 10),
        floorNumber: form.floorNumber === "" ? undefined : parseInt(form.floorNumber, 10),
        totalFloors: form.totalFloors === "" ? undefined : parseInt(form.totalFloors, 10),
        occupancyStatus: form.occupancyStatus || undefined,
        requestType: form.requestType,
        urgency: form.urgency,
        notes: form.notes.trim() || undefined,
        uploadedImages: form.uploadedImages,
        consentContact: form.consentContact,
        consentDataUse: form.consentDataUse,
      };
      const res = await createInspectionRequest(payload);
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
            {t("services.common.successBodyInspection")}
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold text-white">
                {tx("services.common.nextStepTitle", "What happens next")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {tx(
                  "services.inspection.form.successNext",
                  "We review the request and get in touch to confirm timing, access, and report scope."
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold text-white">
                {tx("services.inspection.form.keepChatOpen", "Need to add anything else?")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                {tx(
                  "services.inspection.form.successWhatsAppHint",
                  "You can continue on WhatsApp if you want to share access notes, photos, or timing updates."
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
              href="/my-staging-requests"
              className="inline-flex items-center justify-center rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white hover:opacity-95"
            >
              {tx("services.privatePanel.openPanel", "Open private panel")}
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/20"
            >
              {t("services.common.backHome")}
            </a>
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
              {tx("services.inspection.form.eyebrow", "Start with the essentials")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {tx(
                "services.inspection.form.introTitle",
                "Tell us who you are and what kind of inspection you need."
              )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/72">
              {tx(
                "services.inspection.form.introBody",
                "The first step takes care of the key contact and request details. Property information can come next if you have it handy."
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
            {tx("services.inspection.form.stepOneTitle", "Contact and request basics")}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-white">
            {tx(
              "services.inspection.form.stepOneBody",
              "Share the core details so we know who the report should support and how quickly you need it."
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
            {tx("services.inspection.form.stepTwoTitle", "Property details and final review")}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-white">
            {tx(
              "services.inspection.form.stepTwoBody",
              "Add property context, photos, and consent before you send. These details are optional, but helpful."
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
              <h3 className="text-lg font-semibold text-green-300">
                {tx("services.inspection.form.contactTitle", "Who should we contact?")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-green-300">
                {tx(
                  "services.inspection.form.contactBody",
                  "Use the contact details that are best for scheduling and follow-up."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.inspection.form.fullName")} *</label>
                <input
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  placeholder={tx("services.inspection.form.fullNamePlaceholder", "Your full name")}
                />
                {fieldErrors.fullName ? (
                  <p className={errorTextClass}>{fieldErrors.fullName}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.inspection.form.fullNameHelper",
                      "We will use this name when confirming the request."
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t("services.inspection.form.phone")} *</label>
                <input
                  className={inputClass}
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder={tx("services.inspection.form.phonePlaceholder", "+90 5XX XXX XXXX")}
                />
                {fieldErrors.phone ? (
                  <p className={errorTextClass}>{fieldErrors.phone}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.inspection.form.phoneHelper",
                      "Use the number where we can quickly confirm timing or access."
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t("services.inspection.form.email")} *</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder={tx("services.inspection.form.emailPlaceholder", "name@example.com")}
                />
                {fieldErrors.email ? (
                  <p className={errorTextClass}>{fieldErrors.email}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.inspection.form.emailHelper",
                      "Useful if we need to send a written confirmation or follow-up."
                    )}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.inspection.form.whatsapp")}</label>
                <input
                  className={inputClass}
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  placeholder={t("services.inspection.form.whatsappHint")}
                />
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.whatsappHelper",
                    "Optional. Helpful if you prefer quick replies, image sharing, or live coordination."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.inspection.form.requestBasicsTitle", "How should we frame the inspection?")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.inspection.form.requestBasicsBody",
                  "These selections help us route the request and set expectations before we review the property details."
                )}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-white">
                  {t("services.inspection.form.requesterType")}
                </p>
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.requesterTypeHelper",
                    "Let us know which point of view the report should support."
                  )}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {INSPECTION_REQUESTER_TYPES.map((value) => {
                    const selected = form.requesterType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("requesterType", value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-[#06a84e]/55 bg-[#06a84e]/14 text-white"
                            : "border-white/12 bg-white/[0.02] text-green-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-semibold">
                          {t(`services.enums.inspection.requester.${value}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {t("services.inspection.form.requestType")}
                </p>
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.requestTypeHelper",
                    "Choose the kind of report context you want us to prioritize."
                  )}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {INSPECTION_REQUEST_TYPES.map((value) => {
                    const selected = form.requestType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("requestType", value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-[#06a84e]/55 bg-[#06a84e]/14 text-white"
                            : "border-white/12 bg-white/[0.02] text-green-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-semibold">
                          {t(`services.enums.inspection.requestType.${value}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {t("services.inspection.form.urgency")}
                </p>
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.urgencyHelper",
                    "This gives us a scheduling signal. It does not lock in a slot."
                  )}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {INSPECTION_URGENCY.map((value) => {
                    const selected = form.urgency === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("urgency", value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-[#06a84e]/55 bg-[#06a84e]/14 text-white"
                            : "border-white/12 bg-white/[0.02] text-green-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-semibold">
                          {t(`services.enums.inspection.urgency.${value}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-white/62">
              {tx(
                "services.inspection.form.continueHint",
                "Next you can add property context, photos, and the final consent before sending."
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
                  {tx("services.inspection.form.propertyStepTitle", "Property details and final review")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/68">
                  {tx(
                    "services.inspection.form.propertyStepBody",
                    "Everything below helps us scope access, time, and reporting. Add what you know and leave the rest blank."
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
                {tx("services.inspection.form.propertyBasicsTitle", "Property basics")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.inspection.form.propertyBasicsBody",
                  "A few location and reference details usually speed up the first review."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("services.inspection.form.propertyType")}</label>
                <select
                  className={inputClass}
                  value={form.propertyType}
                  onChange={(e) => setField("propertyType", e.target.value)}
                >
                  <option value="" className="bg-slate-900">
                    {tx(
                      "services.inspection.form.propertyTypeSelect",
                      "Select property type"
                    )}
                  </option>
                  {INSPECTION_PROPERTY_TYPES.map(([value, fallbackLabel]) => (
                    <option key={value} value={value} className="bg-slate-900">
                      {tx(`services.common.propertyTypes.${value}`, fallbackLabel)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.city")}</label>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder={tx("services.inspection.form.cityPlaceholder", "City")}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.district")}</label>
                <input
                  className={inputClass}
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.districtPlaceholder",
                    "District or neighborhood"
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.referenceCode")}</label>
                <input
                  className={inputClass}
                  value={form.referenceCode}
                  onChange={(e) => setField("referenceCode", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.referenceCodePlaceholder",
                    "Listing or internal reference"
                  )}
                />
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.referenceCodeHelper",
                    "Helpful if the property already has a listing code or internal reference."
                  )}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.inspection.form.address")}</label>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.addressPlaceholder",
                    "Full address, building name, or pin reference"
                  )}
                />
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.addressHelper",
                    "A full address is ideal, but a building name or nearby landmark is enough for now."
                  )}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("services.inspection.form.propertyUrl")}</label>
                <input
                  className={inputClass}
                  value={form.propertyUrl}
                  onChange={(e) => setField("propertyUrl", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.propertyUrlPlaceholder",
                    "https://example.com/listing"
                  )}
                />
                {fieldErrors.propertyUrl ? (
                  <p className={errorTextClass}>{fieldErrors.propertyUrl}</p>
                ) : (
                  <p className={helperTextClass}>
                    {tx(
                      "services.inspection.form.propertyUrlHelper",
                      "Optional. Paste the listing link if the asset is already online."
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.inspection.form.buildingSnapshotTitle", "Building snapshot")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.inspection.form.buildingSnapshotBody",
                  "Share any measurements or occupancy context you already know. This step is optional."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("services.inspection.form.grossArea")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={inputClass}
                  value={form.grossArea}
                  onChange={(e) => setField("grossArea", e.target.value)}
                  placeholder={tx("services.inspection.form.grossAreaPlaceholder", "m2")}
                />
                {fieldErrors.grossArea ? <p className={errorTextClass}>{fieldErrors.grossArea}</p> : null}
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.netArea")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={inputClass}
                  value={form.netArea}
                  onChange={(e) => setField("netArea", e.target.value)}
                  placeholder={tx("services.inspection.form.netAreaPlaceholder", "m2")}
                />
                {fieldErrors.netArea ? <p className={errorTextClass}>{fieldErrors.netArea}</p> : null}
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.buildingAge")}</label>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={inputClass}
                  value={form.buildingAge}
                  onChange={(e) => setField("buildingAge", e.target.value)}
                  placeholder={tx("services.inspection.form.buildingAgePlaceholder", "Years")}
                />
                {fieldErrors.buildingAge ? (
                  <p className={errorTextClass}>{fieldErrors.buildingAge}</p>
                ) : null}
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.floorNumber")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                  value={form.floorNumber}
                  onChange={(e) => setField("floorNumber", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.floorNumberPlaceholder",
                    "Current floor"
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.totalFloors")}</label>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={inputClass}
                  value={form.totalFloors}
                  onChange={(e) => setField("totalFloors", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.totalFloorsPlaceholder",
                    "Total floors in the building"
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>{t("services.inspection.form.occupancy")}</label>
                <select
                  className={inputClass}
                  value={form.occupancyStatus}
                  onChange={(e) => setField("occupancyStatus", e.target.value)}
                >
                  <option value="" className="bg-slate-900">
                    {t("services.common.selectOptional")}
                  </option>
                  {INSPECTION_OCCUPANCY.map((value) => (
                    <option key={value} value={value} className="bg-slate-900">
                      {t(`services.enums.inspection.occupancy.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className={labelClass}>{t("services.inspection.form.notes")}</label>
                <textarea
                  rows={7}
                  className={`${inputClass} min-h-[180px]`}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder={tx(
                    "services.inspection.form.notesPlaceholder",
                    "Add anything that would help the visit go smoothly: visible issues, access notes, ideal timing, or special concerns."
                  )}
                />
                <p className={helperTextClass}>
                  {tx(
                    "services.inspection.form.notesHelper",
                    "Optional. Mention visible concerns, decision deadlines, access notes, or anything the inspector should prepare for."
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white">
                      <MdOutlinePhotoLibrary className="text-xl text-[#9cffbe]" />
                      <p className="font-semibold">{t("services.inspection.form.photos")}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white/68">
                      {tx(
                        "services.inspection.form.photosHelper",
                        "Optional. A few overview photos or screenshots are enough if you want us to understand visible issues faster."
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || loading}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {uploading ? t("services.common.uploading") : t("services.common.addPhotos")}
                  </button>
                </div>

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
                      "services.inspection.form.noPhotosYet",
                      "No photos added yet. You can submit without them."
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.common.finalChecks", "Final checks")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.inspection.form.finalChecksBody",
                  "Confirm that we can contact you about this request. Marketing consent stays optional."
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
                  {t("services.inspection.form.consentContact")}
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
                  {t("services.inspection.form.consentMarketing")}
                </span>
              </label>
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

export default InspectionServiceForm;
