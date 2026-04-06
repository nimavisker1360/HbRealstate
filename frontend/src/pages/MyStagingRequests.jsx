import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import {
  MdArrowOutward,
  MdBuild,
  MdEventAvailable,
  MdPlace,
  MdRefresh,
  MdSchedule,
  MdVisibility,
} from "react-icons/md";
import UserDetailContext from "../context/UserDetailContext";
import { getMyInspectionRequestsApi, getMyStagingRequestsApi } from "../utils/api";
import { buildLocalizedPath } from "../utils/languageRouting";
import {
  buildStagingProjectPath,
  caseStudyBody,
  caseStudyHeadline,
  formatCurrencyRange,
  formatCurrencyValue,
  formatPercentValue,
  getProjectServices,
  humanizeToken,
  pickCaseStudy,
  pickPackageName,
  pickProjectTimeline,
} from "../utils/servicesContent";

const REQUEST_STATUS_STYLES = {
  new: "bg-blue-500/15 text-blue-200 border-blue-400/25",
  qualified: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
  proposal_sent: "bg-indigo-500/15 text-indigo-200 border-indigo-400/25",
  approved: "bg-violet-500/15 text-violet-200 border-violet-400/25",
  planning: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/25",
  in_progress: "bg-amber-500/15 text-amber-100 border-amber-300/25",
  content_pending: "bg-yellow-500/15 text-yellow-100 border-yellow-300/25",
  completed: "bg-emerald-500/15 text-emerald-100 border-emerald-300/25",
  published: "bg-green-500/15 text-green-100 border-green-300/25",
  closed: "bg-slate-500/15 text-slate-200 border-slate-400/25",
  cancelled: "bg-red-500/15 text-red-100 border-red-300/25",
};

const PROJECT_STATUS_STYLES = {
  planning: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/25",
  in_progress: "bg-amber-500/15 text-amber-100 border-amber-300/25",
  content_pending: "bg-yellow-500/15 text-yellow-100 border-yellow-300/25",
  completed: "bg-emerald-500/15 text-emerald-100 border-emerald-300/25",
  published: "bg-green-500/15 text-green-100 border-green-300/25",
  on_hold: "bg-orange-500/15 text-orange-100 border-orange-300/25",
  cancelled: "bg-red-500/15 text-red-100 border-red-300/25",
};

const INSPECTION_STATUS_STYLES = {
  new: "bg-blue-500/15 text-blue-200 border-blue-400/25",
  contacted: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
  scheduled: "bg-indigo-500/15 text-indigo-200 border-indigo-400/25",
  in_review: "bg-violet-500/15 text-violet-200 border-violet-400/25",
  inspection_completed: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/25",
  report_drafting: "bg-amber-500/15 text-amber-100 border-amber-300/25",
  report_ready: "bg-teal-500/15 text-teal-100 border-teal-300/25",
  delivered: "bg-green-500/15 text-green-100 border-green-300/25",
  closed: "bg-slate-500/15 text-slate-200 border-slate-400/25",
  cancelled: "bg-red-500/15 text-red-100 border-red-300/25",
};

const REPORT_STATUS_STYLES = {
  draft: "bg-slate-500/15 text-slate-200 border-slate-400/25",
  review: "bg-yellow-500/15 text-yellow-100 border-yellow-300/25",
  final: "bg-teal-500/15 text-teal-100 border-teal-300/25",
  delivered: "bg-green-500/15 text-green-100 border-green-300/25",
};

const fallbackBadgeClass = "bg-white/10 text-white/75 border-white/15";
const INSPECTION_REQUEST_TO_REPORT_STATUS = {
  report_drafting: "draft",
  report_ready: "final",
  delivered: "delivered",
};
const INSPECTION_REPORT_PHOTO_PREFIX = {
  before: "before::",
  after: "after::",
};
const INSPECTION_SECTION_DEFS = [
  {
    key: "structuralSafety",
    label: "Structural safety",
    labelKey: "services.privatePanel.inspectionSections.structuralSafety",
  },
  {
    key: "legalCompliance",
    label: "Legal compliance",
    labelKey: "services.privatePanel.inspectionSections.legalCompliance",
  },
  {
    key: "utilitiesPlumbing",
    label: "Utilities and plumbing",
    labelKey: "services.privatePanel.inspectionSections.utilitiesPlumbing",
  },
  {
    key: "electricalSafety",
    label: "Electrical safety",
    labelKey: "services.privatePanel.inspectionSections.electricalSafety",
  },
  {
    key: "comfortInsulation",
    label: "Comfort and insulation",
    labelKey: "services.privatePanel.inspectionSections.comfortInsulation",
  },
];
const INSPECTION_SCORE_TONES = {
  strong: {
    panel: "border-emerald-200 bg-emerald-50",
    value: "text-emerald-700",
    label: "text-emerald-800",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    meter: "bg-emerald-500",
  },
  good: {
    panel: "border-teal-200 bg-teal-50",
    value: "text-teal-700",
    label: "text-teal-800",
    chip: "border-teal-200 bg-teal-50 text-teal-800",
    meter: "bg-teal-500",
  },
  needs_attention: {
    panel: "border-amber-200 bg-amber-50",
    value: "text-amber-700",
    label: "text-amber-800",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    meter: "bg-amber-500",
  },
  high_risk: {
    panel: "border-rose-200 bg-rose-50",
    value: "text-rose-700",
    label: "text-rose-800",
    chip: "border-rose-200 bg-rose-50 text-rose-800",
    meter: "bg-rose-500",
  },
  pending: {
    panel: "border-slate-200 bg-slate-50",
    value: "text-slate-700",
    label: "text-slate-700",
    chip: "border-slate-200 bg-slate-50 text-slate-700",
    meter: "bg-slate-300",
  },
};
const CHECKLIST_STATUS_PRIORITY = {
  critical: 5,
  risky: 4,
  acceptable: 3,
  good: 2,
  not_checked: 1,
};
const SEVERITY_PRIORITY = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  none: 1,
};

const formatDate = (value, locale = "en") => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value, locale = "en") => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatInspectionLabel = (value = "") =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getTextValue = (value) => (typeof value === "string" ? value.trim() : "");

const getNumericValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatAmount = (value, locale = "en") => {
  const numericValue = getNumericValue(value);
  if (numericValue == null) return "";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(numericValue);
};

const formatMoney = (value, currency = "USD", locale = "en") => {
  const numericValue = getNumericValue(value);
  if (numericValue == null) return "";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numericValue);
  } catch {
    return `${currency} ${formatAmount(numericValue, locale)}`;
  }
};

const getEffectiveInspectionReportStatus = (request, report) =>
  report?.status || INSPECTION_REQUEST_TO_REPORT_STATUS[request?.status] || "";

const getInspectionScoreToneKey = (score) => {
  const numericScore = getNumericValue(score);

  if (numericScore == null) return "pending";
  if (numericScore >= 85) return "strong";
  if (numericScore >= 70) return "good";
  if (numericScore >= 50) return "needs_attention";
  return "high_risk";
};

const getInspectionRiskToneKey = (riskLabel, fallbackScore) => {
  const normalizedRisk = getTextValue(riskLabel);
  if (normalizedRisk && INSPECTION_SCORE_TONES[normalizedRisk]) return normalizedRisk;
  return getInspectionScoreToneKey(fallbackScore);
};

const getInspectionPreviewPhotos = (reportPhotos = [], fallbackBeforePhotos = []) =>
  (Array.isArray(reportPhotos) ? reportPhotos : []).reduce(
    (groups, item) => {
      const value = getTextValue(item);
      if (!value) return groups;

      if (value.startsWith(INSPECTION_REPORT_PHOTO_PREFIX.before)) {
        groups.before.push(value.slice(INSPECTION_REPORT_PHOTO_PREFIX.before.length));
        return groups;
      }

      if (value.startsWith(INSPECTION_REPORT_PHOTO_PREFIX.after)) {
        groups.after.push(value.slice(INSPECTION_REPORT_PHOTO_PREFIX.after.length));
        return groups;
      }

      groups.after.push(value);
      return groups;
    },
    {
      before: Array.isArray(fallbackBeforePhotos) ? fallbackBeforePhotos.filter(Boolean) : [],
      after: [],
    },
  );

const getInspectionSectionScores = (sectionScores, getSectionLabel) =>
  INSPECTION_SECTION_DEFS.map((section) => {
    const score = getNumericValue(sectionScores?.[section.key]);
    return score == null
      ? null
      : {
          key: section.key,
          label: getSectionLabel(section.key),
          score: Math.round(score),
        };
  }).filter(Boolean);

const getReportFindings = (report, getSectionLabel, defaultSectionLabel) =>
  Array.isArray(report?.keyFindings)
    ? report.keyFindings
        .filter((finding) => getTextValue(finding?.finding))
        .map((finding, index) => ({
          id: `report-finding-${index}`,
          sectionLabel: getSectionLabel(finding?.section) || defaultSectionLabel,
          title: getTextValue(finding?.finding),
          detail: "",
          severity: getTextValue(finding?.severity),
          status: "",
        }))
    : [];

const getChecklistFindings = (checklist, getSectionLabel) =>
  INSPECTION_SECTION_DEFS.flatMap((section) => {
    const items = Array.isArray(checklist?.[section.key]) ? checklist[section.key] : [];

    return items
      .filter((item) => {
        const status = getTextValue(item?.status);
        const severity = getTextValue(item?.severity);
        const note = getTextValue(item?.note);
        return (
          note ||
          status === "risky" ||
          status === "critical" ||
          severity === "high" ||
          severity === "critical"
        );
      })
      .map((item, index) => ({
        id: `${section.key}-${item?.key || index}`,
        sectionLabel: getSectionLabel(section.key),
        title:
          getTextValue(item?.label) || formatInspectionLabel(item?.key) || getSectionLabel(section.key),
        detail: getTextValue(item?.note),
        severity: getTextValue(item?.severity),
        status: getTextValue(item?.status),
      }));
  }).sort((left, right) => {
    const leftPriority =
      SEVERITY_PRIORITY[left.severity] || CHECKLIST_STATUS_PRIORITY[left.status] || 0;
    const rightPriority =
      SEVERITY_PRIORITY[right.severity] || CHECKLIST_STATUS_PRIORITY[right.status] || 0;
    return rightPriority - leftPriority;
  });

const getReportRepairEstimates = (report) =>
  Array.isArray(report?.repairEstimates)
    ? report.repairEstimates
        .filter((estimate) => getTextValue(estimate?.item))
        .map((estimate, index) => ({
          id: `report-estimate-${index}`,
          item: getTextValue(estimate?.item),
          cost: getNumericValue(estimate?.estimatedCost),
          currency: getTextValue(estimate?.currency) || "USD",
          source: "report",
        }))
    : [];

const getChecklistRepairEstimates = (checklist, getSectionLabel) =>
  INSPECTION_SECTION_DEFS.flatMap((section) => {
    const items = Array.isArray(checklist?.[section.key]) ? checklist[section.key] : [];

    return items
      .filter((item) => getNumericValue(item?.repairCostEstimate) != null)
      .map((item, index) => ({
        id: `${section.key}-repair-${item?.key || index}`,
        item:
          getTextValue(item?.label) || formatInspectionLabel(item?.key) || getSectionLabel(section.key),
        cost: getNumericValue(item?.repairCostEstimate),
        currency: "",
        source: "checklist",
      }));
  });

const SectionHeader = ({ title, body, count }) => (
  <div className="flex items-center justify-between gap-3">
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
      {count}
    </span>
  </div>
);

const MyStagingRequests = () => {
  const { t, i18n } = useTranslation();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const { user } = useAuth0();
  const {
    userDetails: { token },
  } = useContext(UserDetailContext);
  const [stagingRequests, setStagingRequests] = useState([]);
  const [inspectionRequests, setInspectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lang = i18n.language?.slice(0, 2) || "en";
  const locale = i18n.language || "en";
  const localizePath = (pathname) => buildLocalizedPath({ pathname, language: lang });
  const translateToken = (namespace, value, formatter = humanizeToken) => {
    const normalizedValue = getTextValue(value);
    if (!normalizedValue) return "";
    return tx(`${namespace}.${normalizedValue}`, formatter(normalizedValue));
  };
  const translatePropertyType = (value) =>
    translateToken("services.common.propertyTypes", value, humanizeToken);
  const translateInspectionRequester = (value) =>
    translateToken("services.enums.inspection.requester", value, humanizeToken);
  const translateInspectionRequestType = (value) =>
    translateToken("services.enums.inspection.requestType", value, humanizeToken);
  const translateInspectionUrgency = (value) =>
    translateToken("services.enums.inspection.urgency", value, humanizeToken);
  const translateStagingGoal = (value) =>
    translateToken("services.enums.staging.targetGoal", value, humanizeToken);
  const translateStagingBudget = (value) =>
    translateToken("services.enums.staging.budget", value, humanizeToken);
  const translateStagingTimeline = (value) =>
    translateToken("services.enums.staging.timeline", value, humanizeToken);
  const translateStagingService = (value) =>
    translateToken("services.enums.staging.service", value, humanizeToken);
  const translatePanelStatus = (value) =>
    translateToken("services.privatePanel.status", value, humanizeToken);
  const translateReportStatus = (value) =>
    translateToken("services.privatePanel.reportStatusValue", value, humanizeToken);
  const translateRiskLabel = (value) =>
    translateToken("services.privatePanel.riskValue", value, formatInspectionLabel);
  const translateScoreTone = (value) =>
    translateToken("services.privatePanel.scoreTone", value, formatInspectionLabel);
  const translateFindingSeverity = (value) =>
    translateToken("services.privatePanel.findingSeverity", value, formatInspectionLabel);
  const translateFindingStatus = (value) =>
    translateToken("services.privatePanel.findingStatus", value, formatInspectionLabel);
  const translateInspectionSection = (sectionKey) => {
    const normalizedKey = getTextValue(sectionKey);
    const sectionDef = INSPECTION_SECTION_DEFS.find((section) => section.key === normalizedKey);
    if (sectionDef) return tx(sectionDef.labelKey, sectionDef.label);
    return normalizedKey
      ? formatInspectionLabel(normalizedKey)
      : tx("services.privatePanel.inspectionLabel", "Inspection");
  };

  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const [stagingResult, inspectionResult] = await Promise.allSettled([
        getMyStagingRequestsApi(token),
        getMyInspectionRequestsApi(token),
      ]);

      const nextStaging =
        stagingResult.status === "fulfilled" && Array.isArray(stagingResult.value?.data)
          ? stagingResult.value.data
          : [];
      const nextInspection =
        inspectionResult.status === "fulfilled" && Array.isArray(inspectionResult.value?.data)
          ? inspectionResult.value.data
          : [];

      setStagingRequests(nextStaging);
      setInspectionRequests(nextInspection);

      if (stagingResult.status === "rejected" && inspectionResult.status === "rejected") {
        setError(
          stagingResult.reason?.response?.data?.message ||
            inspectionResult.reason?.response?.data?.message ||
            tx("services.privatePanel.loadError", "Unable to load your requests.")
        );
      }
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          tx("services.privatePanel.loadError", "Unable to load your requests.")
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const totalRequests = stagingRequests.length + inspectionRequests.length;

  const renderStagingRequestCard = (request) => {
    const project = request.project || null;
    const caseStudy = project ? pickCaseStudy(project, lang) : null;
    const headline =
      (caseStudy ? caseStudyHeadline(caseStudy) : "") ||
      project?.title ||
      tx("services.privatePanel.stagingFallbackTitle", "Staging / renovation request");
    const companyBody = (caseStudy ? caseStudyBody(caseStudy) : "") || project?.notes || "";
    const requestBudget = request.budgetRange
      ? `${translateStagingBudget(request.budgetRange)} ${request.budgetCurrency || "USD"}`
      : "";
    const requestPropertyLabel = [translatePropertyType(request.propertyType), request.city, request.district]
      .filter(Boolean)
      .join(" | ");
    const projectBudget =
      project?.budgetEstimate != null
        ? formatCurrencyValue(project.budgetEstimate, project.budgetCurrency || "USD", locale)
        : "";
    const packageBudget = project?.package ? formatCurrencyRange(project.package, locale) : "";
    const projectTimeline = project ? pickProjectTimeline(project, lang) : "";
    const packageName = project ? pickPackageName(project.package, lang) : "";
    const currentScope = project ? getProjectServices(project) : [];
    const metrics = [
      formatPercentValue(project?.expectedValueUplift, locale)
        ? {
            label: tx("services.privatePanel.metricValueUplift", "Value uplift"),
            value: formatPercentValue(project?.expectedValueUplift, locale),
          }
        : null,
      formatPercentValue(project?.expectedRentalUplift, locale)
        ? {
            label: tx("services.privatePanel.metricRentalUplift", "Rental uplift"),
            value: formatPercentValue(project?.expectedRentalUplift, locale),
          }
        : null,
      project?.expectedSaleSpeedDays != null
        ? {
            label: tx("services.privatePanel.metricSaleSpeed", "Sale speed"),
            value: t("services.privatePanel.metricSaleSpeedValue", {
              defaultValue: "{{days}} days faster",
              days: project.expectedSaleSpeedDays,
            }),
          }
        : null,
    ].filter(Boolean);
    const hasVisitSchedule = Boolean(request.visitScheduledAt);

    return (
      <article
        key={request.id}
        className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      >
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#1f2f3d_0%,#243748_100%)] px-6 py-5 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9cffbe]">
                {tx("services.privatePanel.stagingLabel", "Staging / Renovation")}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{headline}</h2>
              <p className="mt-2 text-sm text-white/65">
                {tx("services.privatePanel.submittedOn", "Submitted")}: {formatDate(request.createdAt, locale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  REQUEST_STATUS_STYLES[request.status] || fallbackBadgeClass
                }`}
              >
                {translatePanelStatus(request.status)}
              </span>
              {project?.status && (
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    PROJECT_STATUS_STYLES[project.status] || fallbackBadgeClass
                  }`}
                >
                  {tx("services.privatePanel.projectLabel", "Project")}: {translatePanelStatus(project.status)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <section className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {tx("services.privatePanel.requestSummary", "Your request")}
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <strong>{tx("services.privatePanel.goal", "Goal")}:</strong>{" "}
                {request.targetGoal ? translateStagingGoal(request.targetGoal) : "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.requestBudget", "Budget")}:</strong>{" "}
                {requestBudget || "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.requestTimeline", "Timeline")}:</strong>{" "}
                {request.desiredTimeline ? translateStagingTimeline(request.desiredTimeline) : "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.property", "Property")}:</strong>{" "}
                {requestPropertyLabel || "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.requestedServices", "Requested services")}:</strong>{" "}
                {request.requestedServices?.length
                  ? request.requestedServices.map((item) => translateStagingService(item)).join(", ")
                  : "-"}
              </p>
              {request.notes && (
                <p>
                  <strong>{tx("services.privatePanel.yourNotes", "Your notes")}:</strong> {request.notes}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#06a84e]/12 p-2 text-[#0a8f47]">
                <MdBuild className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tx("services.privatePanel.companyUpdate", "Company update")}
                </p>

                {hasVisitSchedule && (
                  <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-sky-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,0.95),_rgba(255,255,255,0.98)_55%,_rgba(236,253,245,0.96)_100%)] p-5 shadow-[0_20px_40px_rgba(8,145,178,0.08)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-sky-500 p-3 text-white shadow-lg shadow-sky-200/60">
                          <MdEventAvailable className="text-2xl" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                            {tx("services.privatePanel.visitChecklist", "Visit checklist")}
                          </p>
                          <h3 className="mt-2 text-xl font-bold text-slate-900">
                            {tx("services.privatePanel.visitScheduled", "Property visit booked")}
                          </h3>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                            {tx(
                              "services.privatePanel.visitScheduledBody",
                              "The company has shared your property visit time. Review the schedule and note below."
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                        {translatePanelStatus(request.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <MdSchedule className="text-sky-600" />
                          {tx("services.privatePanel.visitDateTime", "Visit time")}
                        </div>
                        <div className="mt-3 text-lg font-bold text-slate-900">
                          {formatDateTime(request.visitScheduledAt, locale)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <MdPlace className="text-emerald-600" />
                          {tx("services.privatePanel.visitLocation", "Location")}
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">
                          {requestPropertyLabel || tx("services.privatePanel.property", "Property")}
                        </div>
                      </div>
                    </div>

                    {request.visitScheduleNotes && (
                      <div className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-4 text-sm leading-relaxed text-slate-700">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {tx("services.privatePanel.visitNote", "Checklist note")}
                        </span>
                        <p className="mt-2">{request.visitScheduleNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {project ? (
                  <>
                    {packageName && (
                      <span className="mt-3 inline-flex rounded-full border border-amber-300/50 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                        {packageName}
                      </span>
                    )}
                    {companyBody && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">{companyBody}</p>
                    )}
                    <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <strong>{tx("services.privatePanel.companyBudget", "Company estimate")}:</strong>
                        <div className="mt-2">{projectBudget || packageBudget || "-"}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <strong>{tx("services.privatePanel.companyTimeline", "Working timeline")}:</strong>
                        <div className="mt-2">{projectTimeline || "-"}</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-700">
                      <strong>{tx("services.privatePanel.scope", "Current scope")}:</strong>{" "}
                      {currentScope.length ? currentScope.map((item) => translateStagingService(item)).join(", ") : "-"}
                    </p>
                    {metrics.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {metrics.map((metric) => (
                          <span
                            key={metric.label}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700"
                          >
                            {metric.label}: {metric.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {project.published ? (
                        <Link
                          to={localizePath(buildStagingProjectPath(project))}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#059944]"
                        >
                          {tx("services.privatePanel.viewPublicShowcase", "View public showcase")}
                          <MdArrowOutward className="text-lg" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                          {tx(
                            "services.privatePanel.privateOnly",
                            "Visible only in your private account until published."
                          )}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  !hasVisitSchedule && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {tx(
                        "services.privatePanel.pendingCompanyUpdate",
                        "The company has not added a formal project update yet."
                      )}
                    </p>
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      </article>
    );
  };

  const renderInspectionRequestCard = (request) => {
    const checklist = request.checklist || null;
    const report = request.report || null;
    const visitDateValue = request.visitScheduledAt || request.scheduledDate || null;
    const hasVisitSchedule = Boolean(visitDateValue);
    const reportFiles = Array.isArray(report?.reportFiles) ? report.reportFiles.filter(Boolean) : [];
    const previewPhotos = getInspectionPreviewPhotos(report?.reportPhotos, request.uploadedImages);
    const beforePreviewPhotos = previewPhotos.before;
    const afterPreviewPhotos = previewPhotos.after;
    const hasPropertyPreview = beforePreviewPhotos.length > 0 || afterPreviewPhotos.length > 0;
    const effectiveReportStatus = getEffectiveInspectionReportStatus(request, report);
    const scoreValue = getNumericValue(report?.totalScore) ?? getNumericValue(checklist?.totalScore);
    const riskValue = getTextValue(report?.riskLabel) || getTextValue(checklist?.riskLabel);
    const scoreToneKey = getInspectionScoreToneKey(scoreValue);
    const riskToneKey = getInspectionRiskToneKey(riskValue, scoreValue);
    const scoreTone = INSPECTION_SCORE_TONES[scoreToneKey];
    const riskTone = INSPECTION_SCORE_TONES[riskToneKey];
    const summaryText = getTextValue(report?.summary);
    const recommendationText =
      getTextValue(report?.recommendation) || getTextValue(checklist?.overallRecommendation);
    const disclaimerText = getTextValue(report?.disclaimer);
    const sectionScores = getInspectionSectionScores(
      report?.sectionScores || checklist?.sectionScores,
      translateInspectionSection
    );
    const findings = getReportFindings(
      report,
      translateInspectionSection,
      tx("services.privatePanel.inspectionLabel", "Inspection")
    );
    const displayFindings =
      findings.length > 0 ? findings : getChecklistFindings(checklist, translateInspectionSection);
    const repairEstimates = getReportRepairEstimates(report);
    const displayRepairEstimates =
      repairEstimates.length > 0
        ? repairEstimates
        : getChecklistRepairEstimates(checklist, translateInspectionSection);
    const lastUpdate =
      report?.deliveredAt || report?.updatedAt || report?.generatedAt || checklist?.completedAt || request.updatedAt;
    const headlineParts = [
      request.requestType
        ? translateInspectionRequestType(request.requestType)
        : tx("services.privatePanel.inspectionLabel", "Inspection"),
      [request.city, request.district].filter(Boolean).join(" | "),
    ].filter(Boolean);
    const headline =
      headlineParts.join(" - ") ||
      tx("services.privatePanel.inspectionFallbackTitle", "Property inspection request");
    const requestPropertyLabel =
      [translatePropertyType(request.propertyType), request.city, request.district]
        .filter(Boolean)
        .join(" | ") || tx("services.privatePanel.property", "Property");
    const hasCompanyInspectionUpdate = Boolean(checklist || report || hasVisitSchedule);

    return (
      <article
        key={request.id}
        className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      >
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#203246_0%,#182434_100%)] px-6 py-5 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9cd8ff]">
                {tx("services.privatePanel.inspectionLabel", "Inspection")}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{headline}</h2>
              <p className="mt-2 text-sm text-white/65">
                {tx("services.privatePanel.submittedOn", "Submitted")}: {formatDate(request.createdAt, locale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  INSPECTION_STATUS_STYLES[request.status] || fallbackBadgeClass
                }`}
              >
                {translatePanelStatus(request.status)}
              </span>
              {effectiveReportStatus && (
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    REPORT_STATUS_STYLES[effectiveReportStatus] || fallbackBadgeClass
                  }`}
                >
                  {tx("services.privatePanel.reportLabel", "Report")}: {translateReportStatus(effectiveReportStatus)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <section className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {tx("services.privatePanel.requestSummary", "Your request")}
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <strong>{tx("services.privatePanel.requestType", "Request type")}:</strong>{" "}
                {request.requestType ? translateInspectionRequestType(request.requestType) : "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.urgency", "Urgency")}:</strong>{" "}
                {request.urgency ? translateInspectionUrgency(request.urgency) : "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.requester", "Requester")}:</strong>{" "}
                {request.requesterType ? translateInspectionRequester(request.requesterType) : "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.property", "Property")}:</strong>{" "}
                {requestPropertyLabel || "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.referenceCode", "Reference")}:</strong>{" "}
                {request.referenceCode || "-"}
              </p>
              <p>
                <strong>{tx("services.privatePanel.scheduleLabel", "Schedule")}:</strong>{" "}
                {visitDateValue ? formatDateTime(visitDateValue, locale) : "-"}
              </p>
              {request.notes && (
                <p>
                  <strong>{tx("services.privatePanel.yourNotes", "Your notes")}:</strong> {request.notes}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-sky-500/12 p-2 text-sky-700">
                <MdVisibility className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {tx("services.privatePanel.companyUpdate", "Company update")}
                </p>

                {hasCompanyInspectionUpdate ? (
                  <>
                    {hasVisitSchedule && (
                      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-sky-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,0.95),_rgba(255,255,255,0.98)_55%,_rgba(236,253,245,0.96)_100%)] p-5 shadow-[0_20px_40px_rgba(8,145,178,0.08)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-sky-500 p-3 text-white shadow-lg shadow-sky-200/60">
                              <MdEventAvailable className="text-2xl" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                                {tx("services.privatePanel.visitChecklist", "Visit checklist")}
                              </p>
                              <h3 className="mt-2 text-xl font-bold text-slate-900">
                                {tx("services.privatePanel.visitScheduled", "Property visit booked")}
                              </h3>
                              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                                {tx(
                                  "services.privatePanel.visitScheduledBody",
                                  "The company has shared your property visit time. Review the schedule and note below."
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                            {translatePanelStatus(request.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <MdSchedule className="text-sky-600" />
                              {tx("services.privatePanel.visitDateTime", "Visit time")}
                            </div>
                            <div className="mt-3 text-lg font-bold text-slate-900">
                              {formatDateTime(visitDateValue, locale)}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <MdPlace className="text-emerald-600" />
                              {tx("services.privatePanel.visitLocation", "Location")}
                            </div>
                            <div className="mt-3 text-sm font-semibold text-slate-900">
                              {requestPropertyLabel}
                            </div>
                          </div>
                        </div>

                        {request.visitScheduleNotes && (
                          <div className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-4 text-sm leading-relaxed text-slate-700">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {tx("services.privatePanel.visitNote", "Checklist note")}
                            </span>
                            <p className="mt-2">{request.visitScheduleNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(checklist || report) && (
                    <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                      <div className={`rounded-2xl border p-4 ${scoreTone.panel}`}>
                        <strong>{tx("services.privatePanel.inspectionScore", "Inspection score")}:</strong>
                        <div className={`mt-2 text-lg font-bold ${scoreTone.value}`}>
                          {scoreValue != null ? `${Math.round(scoreValue)}/100` : "-"}
                        </div>
                        {scoreValue != null && (
                          <div className="mt-3">
                            <div className="h-2 overflow-hidden rounded-full bg-white/70">
                              <div
                                className={`h-full rounded-full ${scoreTone.meter}`}
                                style={{ width: `${Math.max(0, Math.min(100, Math.round(scoreValue)))}%` }}
                              />
                            </div>
                            <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.14em] ${scoreTone.label}`}>
                              {translateScoreTone(scoreToneKey)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className={`rounded-2xl border p-4 ${riskTone.panel}`}>
                        <strong>{tx("services.privatePanel.riskLabel", "Risk label")}:</strong>
                        <div className="mt-3">
                          {riskValue ? (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${riskTone.chip}`}
                            >
                              {translateRiskLabel(riskValue)}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <strong>{tx("services.privatePanel.reportStatus", "Report status")}:</strong>
                        <div className="mt-2">
                          {effectiveReportStatus ? translateReportStatus(effectiveReportStatus) : "-"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <strong>{tx("services.privatePanel.updatedLabel", "Last update")}:</strong>
                        <div className="mt-2">{formatDate(lastUpdate, locale) || "-"}</div>
                      </div>
                    </div>
                    )}

                    {sectionScores.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {tx("services.privatePanel.sectionScores", "Section scores")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {sectionScores.map((section) => {
                            const sectionTone = INSPECTION_SCORE_TONES[getInspectionScoreToneKey(section.score)];

                            return (
                              <span
                                key={`${request.id}-${section.key}`}
                                className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${sectionTone.chip}`}
                              >
                                {section.label}: {section.score}/100
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(summaryText || recommendationText || hasPropertyPreview) && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {tx("services.privatePanel.propertyOutcome", "What will happen to your property")}
                        </p>

                        <div className="mt-3 space-y-3">
                          {(summaryText || recommendationText) && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              {summaryText ? (
                                <p className="text-sm leading-relaxed text-slate-700">{summaryText}</p>
                              ) : (
                                <p className="text-sm leading-relaxed text-slate-700">{recommendationText}</p>
                              )}
                              {summaryText && recommendationText && recommendationText !== summaryText ? (
                                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                  <strong>{tx("services.privatePanel.recommendation", "Recommendation")}:</strong>{" "}
                                  {recommendationText}
                                </p>
                              ) : null}
                            </div>
                          )}

                          {hasPropertyPreview && (
                            <div className="grid gap-3 lg:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <strong>{tx("services.privatePanel.beforePhotos", "Before")}</strong>
                                {beforePreviewPhotos.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {beforePreviewPhotos.map((url, index) => (
                                      <a
                                        key={`${request.id}-before-preview-${index}`}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={url}
                                          alt={t("services.privatePanel.beforePhotoAlt", {
                                            defaultValue: "Before property preview {{index}}",
                                            index: index + 1,
                                          })}
                                          className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">
                                    {tx(
                                      "services.privatePanel.noBeforePreview",
                                      "No before preview uploaded"
                                    )}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <strong>{tx("services.privatePanel.afterPhotos", "After")}</strong>
                                {afterPreviewPhotos.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {afterPreviewPhotos.map((url, index) => (
                                      <a
                                        key={`${request.id}-after-preview-${index}`}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={url}
                                          alt={t("services.privatePanel.afterPhotoAlt", {
                                            defaultValue: "After property preview {{index}}",
                                            index: index + 1,
                                          })}
                                          className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">
                                    {tx(
                                      "services.privatePanel.noAfterPreview",
                                      "No after preview uploaded"
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {displayFindings.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {tx("services.privatePanel.keyFindings", "Key findings")}
                        </p>
                        <div className="mt-3 space-y-3">
                          {displayFindings.map((finding) => {
                            const severityLabel = finding.severity
                              ? translateFindingSeverity(finding.severity)
                              : finding.status
                                ? translateFindingStatus(finding.status)
                                : "";

                            return (
                              <div
                                key={`${request.id}-${finding.id}`}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                    {finding.sectionLabel}
                                  </span>
                                  {severityLabel && (
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                      {severityLabel}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-800">{finding.title}</p>
                                {finding.detail && (
                                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{finding.detail}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {displayRepairEstimates.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {tx("services.privatePanel.repairEstimates", "Repair estimates")}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {displayRepairEstimates.map((estimate) => (
                            <div
                              key={`${request.id}-${estimate.id}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <p className="text-sm font-semibold text-slate-800">{estimate.item}</p>
                              <p className="mt-2 text-sm text-slate-600">
                                {estimate.source === "report"
                                  ? formatMoney(estimate.cost, estimate.currency, locale) || "-"
                                  : formatAmount(estimate.cost, locale) || "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {disclaimerText && (
                      <p className="mt-4 text-xs leading-relaxed text-slate-500">{disclaimerText}</p>
                    )}

                    {reportFiles.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-3">
                        {reportFiles.map((url, index) => (
                          <a
                            key={`${request.id}-report-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#059944]"
                          >
                            {tx("services.privatePanel.openReportFile", "Open report file")} {index + 1}
                            <MdArrowOutward className="text-lg" />
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {tx(
                      "services.privatePanel.pendingInspectionUpdate",
                      "The company has not added a checklist or report update yet."
                    )}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </article>
    );
  };

  return (
    <main className="max-padd-container my-[99px] overflow-x-hidden">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#243748_0%,#1b2735_52%,#12202b_100%)] px-5 py-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9cffbe]">
              {tx("services.privatePanel.eyebrow", "Private request panel")}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl sm:leading-tight">
              {tx("services.privatePanel.title", "My Service Requests")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
              {tx(
                "services.privatePanel.subtitle",
                "See your staging, renovation, and inspection requests in one place."
              )}
            </p>
            {user?.email && <p className="mt-3 text-sm text-white/72">{user.email}</p>}
          </div>

          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MdRefresh className={loading ? "animate-spin" : ""} />
            {tx("services.privatePanel.refresh", "Refresh")}
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-8">
        {loading && (
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            {tx("services.common.loading", "Loading")}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && totalRequests === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {tx("services.privatePanel.emptyTitle", "No requests yet")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {tx(
                "services.privatePanel.emptyBody",
                "Your staging, renovation, and inspection requests will appear here after submission."
              )}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                to={localizePath("/services/home-staging/request")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white transition hover:bg-[#059944]"
              >
                {tx("services.privatePanel.ctaStaging", "Submit staging request")}
                <MdArrowOutward className="text-lg" />
              </Link>
              <Link
                to={localizePath("/services/property-inspection/request")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                {tx("services.privatePanel.ctaInspection", "Submit inspection request")}
                <MdArrowOutward className="text-lg" />
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && stagingRequests.length > 0 && (
          <div className="space-y-5">
            <SectionHeader
              title={tx("services.privatePanel.stagingSectionTitle", "Staging & Renovation")}
              body={tx(
                "services.privatePanel.stagingSectionBody",
                "Presentation, renovation, and project updates from the company."
              )}
              count={stagingRequests.length}
            />
            {stagingRequests.map(renderStagingRequestCard)}
          </div>
        )}

        {!loading && !error && inspectionRequests.length > 0 && (
          <div className="space-y-5">
            <SectionHeader
              title={tx("services.privatePanel.inspectionSectionTitle", "Inspection Requests")}
              body={tx(
                "services.privatePanel.inspectionSectionBody",
                "Inspection request status, score, and report updates."
              )}
              count={inspectionRequests.length}
            />
            {inspectionRequests.map(renderInspectionRequestCard)}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyStagingRequests;
