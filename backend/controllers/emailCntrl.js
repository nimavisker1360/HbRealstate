import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import {
  extractLeadAttribution,
  LEAD_STATUS_VALUES,
  normalizeLeadString,
} from "../utils/leadAttribution.js";
import { handleLeadStatusTransition } from "../services/leadStatusWorkflow.js";
import {
  getGmailSender,
  getGmailTransporter,
  getPasswordEmailSender,
  getPasswordEmailTransporter,
  isEmailPasswordConfigured,
} from "../utils/gmailTransporter.js";

const CONTACT_RECIPIENT = "hbrealstate2019@gmail.com";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeOptionalString = (value) => normalizeLeadString(value);

const normalizeOptionalEmail = (value) => {
  const normalizedEmail = normalizeOptionalString(value);
  if (!normalizedEmail) return null;
  return normalizedEmail.toLowerCase();
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatTimestamp = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return new Date().toISOString();
  }

  return value.toISOString();
};

const buildDetailRows = (fields) =>
  fields
    .filter((field) => field.value)
    .map(
      (field) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; width: 160px; vertical-align: top;">
            <strong style="color: #111827;">${escapeHtml(field.label)}</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${field.value}
          </td>
        </tr>
      `
    )
    .join("");

const buildContactEmailHtml = (payload) => {
  const {
    name,
    email,
    phone,
    subject,
    message,
    pageUrl,
    timestamp,
    propertyId,
    propertyTitle,
    listingNo,
    consultantName,
    consultantEmail,
  } = payload;

  const propertySummary = [propertyTitle, listingNo, propertyId]
    .filter(Boolean)
    .join(" | ");
  const consultantSummary = [consultantName, consultantEmail]
    .filter(Boolean)
    .join(" | ");

  const rows = buildDetailRows([
    { label: "Name", value: escapeHtml(name) },
    {
      label: "Email",
      value: email
        ? `<a href="mailto:${escapeHtml(email)}" style="color: #0f766e;">${escapeHtml(email)}</a>`
        : "Not provided",
    },
    {
      label: "Phone",
      value: phone
        ? `<a href="tel:${escapeHtml(phone)}" style="color: #0f766e;">${escapeHtml(phone)}</a>`
        : "Not provided",
    },
    { label: "Subject", value: escapeHtml(subject) },
    {
      label: "Property",
      value: propertySummary ? escapeHtml(propertySummary) : null,
    },
    {
      label: "Consultant",
      value: consultantSummary ? escapeHtml(consultantSummary) : null,
    },
    {
      label: "Page URL",
      value: pageUrl
        ? `<a href="${escapeHtml(pageUrl)}" style="color: #0f766e;">${escapeHtml(pageUrl)}</a>`
        : "Not provided",
    },
    { label: "Timestamp", value: escapeHtml(timestamp) },
  ]);

  return `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; color: #111827;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="padding: 24px 28px; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px;">New Website Contact</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
            Submitted from the HB Real Estate website.
          </p>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${rows}
          </table>
          <div style="margin-top: 24px;">
            <h2 style="margin: 0 0 12px; font-size: 16px; color: #111827;">Message</h2>
            <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; color: #374151; line-height: 1.7;">
              ${escapeHtml(message).replace(/\r?\n/g, "<br />")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const buildContactEmailText = (payload) => {
  const {
    name,
    email,
    phone,
    subject,
    message,
    pageUrl,
    timestamp,
    propertyId,
    propertyTitle,
    listingNo,
    consultantName,
    consultantEmail,
  } = payload;

  return [
    "New Website Contact",
    "",
    `Name: ${name}`,
    `Email: ${email || "Not provided"}`,
    `Phone: ${phone || "Not provided"}`,
    `Subject: ${subject}`,
    `Property Title: ${propertyTitle || "Not provided"}`,
    `Property ID: ${propertyId || "Not provided"}`,
    `Listing No: ${listingNo || "Not provided"}`,
    `Consultant: ${consultantName || "Not provided"}`,
    `Consultant Email: ${consultantEmail || "Not provided"}`,
    `Page URL: ${pageUrl || "Not provided"}`,
    `Timestamp: ${timestamp}`,
    "",
    "Message:",
    message,
  ].join("\n");
};

const isOauthAuthError = (error) =>
  error?.code === "EAUTH" ||
  /invalid_grant|expired|revoked|oauth/i.test(String(error?.message || ""));

const sendContactNotification = async (mailOptions) => {
  try {
    const transporter = getGmailTransporter();
    const sender = getGmailSender();
    return await transporter.sendMail({
      ...mailOptions,
      from: `"HB Real Estate" <${sender}>`,
    });
  } catch (error) {
    if (!isOauthAuthError(error) || !isEmailPasswordConfigured()) {
      throw error;
    }

    console.warn(
      "Gmail OAuth failed; retrying contact notification with password SMTP."
    );

    const fallbackTransporter = getPasswordEmailTransporter();
    const fallbackSender = getPasswordEmailSender();
    return fallbackTransporter.sendMail({
      ...mailOptions,
      from: `"HB Real Estate" <${fallbackSender}>`,
    });
  }
};

export const sendEmail = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    subject,
    message,
    propertyId,
    propertyTitle,
    listingNo,
    consultantId,
    consultantName,
    consultantEmail,
    pageUrl,
  } = req.body || {};

  const leadAttribution = extractLeadAttribution(req, {
    defaultLeadSource: "form",
  });

  const normalizedName = normalizeOptionalString(name);
  const normalizedEmail = normalizeOptionalEmail(email);
  const normalizedPhone = normalizeOptionalString(phone);
  const normalizedMessage = normalizeOptionalString(message);
  const normalizedSubject =
    normalizeOptionalString(subject) || "Website Contact Request";
  const normalizedPageUrl =
    normalizeOptionalString(pageUrl) || leadAttribution.landingPage;
  const submittedAt = leadAttribution.submittedAt || new Date();
  const timestamp = formatTimestamp(submittedAt);

  if (!normalizedName) {
    return res.status(400).json({
      success: false,
      message: "Name is required.",
    });
  }

  if (!normalizedEmail && !normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: "Either email or phone is required.",
    });
  }

  if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  if (!normalizedMessage) {
    return res.status(400).json({
      success: false,
      message: "Message is required.",
    });
  }

  const normalizedPayload = {
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    subject: normalizedSubject,
    message: normalizedMessage,
    pageUrl: normalizedPageUrl,
    timestamp,
    propertyId: normalizeOptionalString(propertyId),
    propertyTitle: normalizeOptionalString(propertyTitle),
    listingNo: normalizeOptionalString(listingNo),
    consultantId: normalizeOptionalString(consultantId),
    consultantName: normalizeOptionalString(consultantName),
    consultantEmail: normalizeOptionalEmail(consultantEmail),
  };

  try {
    await prisma.contactMessage.create({
      data: {
        name: normalizedPayload.name,
        email: normalizedPayload.email,
        phone: normalizedPayload.phone,
        subject: normalizedPayload.subject,
        message: normalizedPayload.message,
        propertyId: normalizedPayload.propertyId,
        propertyTitle: normalizedPayload.propertyTitle,
        consultantId: normalizedPayload.consultantId,
        consultantName: normalizedPayload.consultantName,
        consultantEmail: normalizedPayload.consultantEmail,
        gclid: leadAttribution.gclid,
        gbraid: leadAttribution.gbraid,
        wbraid: leadAttribution.wbraid,
        utmSource: leadAttribution.utmSource,
        utmMedium: leadAttribution.utmMedium,
        utmCampaign: leadAttribution.utmCampaign,
        utmTerm: leadAttribution.utmTerm,
        utmContent: leadAttribution.utmContent,
        landingPage: normalizedPayload.pageUrl,
        referrer: leadAttribution.referrer,
        leadStatus: leadAttribution.leadStatus,
        leadSource: leadAttribution.leadSource,
        submittedAt,
      },
    });

    await sendContactNotification({
      to: CONTACT_RECIPIENT,
      replyTo: normalizedPayload.email || undefined,
      subject: normalizedPayload.subject,
      text: buildContactEmailText(normalizedPayload),
      html: buildContactEmailHtml(normalizedPayload),
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("Contact email submission failed:", error);
    res.status(500).json({
      success: false,
      message: "We could not send your message right now. Please try again later.",
    });
  }
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const nextLeadStatus = extractLeadAttribution(req, {
    defaultLeadStatus: null,
    defaultLeadSource: null,
    defaultSubmittedAt: null,
  }).leadStatus;

  if (!nextLeadStatus || !LEAD_STATUS_VALUES.includes(nextLeadStatus)) {
    return res.status(400).json({
      success: false,
      message: `lead_status must be one of: ${LEAD_STATUS_VALUES.join(", ")}`,
    });
  }

  try {
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const transitionAt = new Date();
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { leadStatus: nextLeadStatus },
    });

    await handleLeadStatusTransition({
      previousLead: existingMessage,
      nextLead: message,
      transitionAt,
    });

    res.status(200).json({
      success: true,
      message: "Lead status updated successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead status",
      error: error.message,
    });
  }
});

export const getAllMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      totalMessages: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.contactMessage.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update message",
      error: error.message,
    });
  }
});
