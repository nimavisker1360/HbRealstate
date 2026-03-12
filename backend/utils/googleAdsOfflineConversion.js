import {
  normalizeLeadDateValue,
  normalizeLeadSource,
  normalizeLeadStatus,
  normalizeLeadString,
} from "./leadAttribution.js";

// Future boundary for Google Ads qualified lead uploads.
// Actual upload logic, credential handling, hashing, and qualification timestamps
// should be added in a later integration step.
export const buildQualifiedLeadConversionPayload = (lead = {}) => {
  const submittedAt = normalizeLeadDateValue(
    lead.submittedAt || lead.submitted_at || lead.createdAt || lead.created_at,
    null
  );
  const qualifiedAt = normalizeLeadDateValue(
    lead.qualifiedAt || lead.qualified_at,
    null
  );

  return {
    conversionAction: normalizeLeadString(
      process.env.GOOGLE_ADS_QUALIFIED_LEAD_CONVERSION_ACTION
    ),
    conversionDateTime: qualifiedAt?.toISOString() || null,
    clickIdentifiers: {
      gclid: normalizeLeadString(lead.gclid),
      gbraid: normalizeLeadString(lead.gbraid),
      wbraid: normalizeLeadString(lead.wbraid),
    },
    userIdentifiers: {
      email: normalizeLeadString(lead.email),
      phoneNumber: normalizeLeadString(lead.phone),
    },
    leadMetadata: {
      leadId: normalizeLeadString(lead.id || lead._id),
      leadStatus: normalizeLeadStatus(lead.leadStatus || lead.lead_status),
      leadSource: normalizeLeadSource(
        lead.leadSource || lead.lead_source || lead.source
      ),
      submittedAt: submittedAt?.toISOString() || null,
      landingPage: normalizeLeadString(
        lead.landingPage || lead.landing_page
      ),
      referrer: normalizeLeadString(lead.referrer),
      utmSource: normalizeLeadString(lead.utmSource || lead.utm_source),
      utmMedium: normalizeLeadString(lead.utmMedium || lead.utm_medium),
      utmCampaign: normalizeLeadString(
        lead.utmCampaign || lead.utm_campaign
      ),
      utmTerm: normalizeLeadString(lead.utmTerm || lead.utm_term),
      utmContent: normalizeLeadString(lead.utmContent || lead.utm_content),
    },
  };
};
