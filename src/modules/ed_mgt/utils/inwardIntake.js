// Shared by Single, Bulk and Email upload: the register-first details form.
import { bulkUploadDocuments } from "../../../api/edmsApi";

export const INTAKE_TYPE_CODE = "INWARD_CORRESPONDENCE";

/** The one document type imports use (seeded by add_inward_intake_document_type.sql). */
export const findIntakeType = (docTypes) =>
  (docTypes || []).find((t) => t.code === INTAKE_TYPE_CODE) || null;

const today = () => new Date().toISOString().slice(0, 10);

export const emptyInwardForm = (overrides = {}) => ({
  serial_no: "",
  date_received: today(),
  source_name: "",
  sender_ref_no: "",
  sender_ref_date: "",
  subject: "",
  confidentiality_level: "INTERNAL",
  restricted_user_ids: [],
  restricted_role_ids: [],
  folio_no: "",
  cross_refs: [],   // documents this one refers to (display objects from the picker)
  enclosures: [],   // physical enclosures: { description, quantity, kept_at }
  // Bookkeeping, never sent: which fields the user typed in, and which came from OCR/AI.
  _touched: {},
  _suggested: {},
  ...overrides,
});

/** Request body for POST /registers/inward/file-document. */
export const toFilingPayload = (documentId, form, extra = {}) => ({
  document_id: documentId,
  serial_no: form.serial_no === "" ? null : Number(form.serial_no),
  date_received: form.date_received,
  source_name: form.source_name.trim(),
  sender_ref_no: form.sender_ref_no.trim() || null,
  sender_ref_date: form.sender_ref_date || null,
  subject: form.subject.trim(),
  folio_no: form.folio_no === "" ? null : Number(form.folio_no),
  confidentiality_level: form.confidentiality_level,
  restricted_user_ids: form.restricted_user_ids,
  restricted_role_ids: form.restricted_role_ids,
  cross_reference_document_ids: (form.cross_refs || []).map((d) => d.id),
  physical_enclosures: (form.enclosures || [])
    .filter((e) => e.description.trim())
    .map((e) => ({ description: e.description.trim(), quantity: e.quantity.trim() || null, kept_at: e.kept_at.trim() || null })),
  ...extra,
});

export const validateInwardForm = (form) => {
  if (!form.date_received) return "Date Received is required.";
  if (!form.source_name.trim()) return "Received From is required.";
  if (!form.subject.trim()) return "Subject is required.";
  if ((form.enclosures || []).some((e) => !e.description.trim() && (e.quantity.trim() || e.kept_at.trim()))) return "Give each physical enclosure a description, or remove it.";
  if (form.serial_no !== "" && !(Number(form.serial_no) >= 1)) return "S/NO must be a positive number, or left blank to auto-generate.";
  return null;
};

// OCR field codes seen from the extractor, mapped onto the form. Matching is on the
// normalised code (lower-case, non-alphanumerics removed) so "Received From", "from_who"
// and "FromWho" all resolve to the same field.
const ALIASES = {
  source_name: ["fromwho", "from", "sender", "sendername", "receivedfrom", "origin", "author"],
  sender_ref_no: ["referencenumber", "referenceno", "refno", "reference", "ref", "yourref", "letterref"],
  sender_ref_date: ["referencedate", "refdate", "letterdate", "dateofletter", "documentdate", "date"],
  subject: ["subject", "re", "title", "subjectline", "regarding"],
  date_received: ["datereceived", "receiveddate", "datestamp", "receivedstamp"],
};

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const toIsoDate = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

/** OCR job `extracted_fields` → { source_name, sender_ref_no, … } (only fields it found). */
export const mapOcrSuggestions = (extractedFields) => {
  const out = {};
  (extractedFields || []).forEach((f) => {
    const value = f.corrected_value ?? f.extracted_value;
    if (value == null || String(value).trim() === "") return;
    const code = norm(f.field_code || f.field_name);
    Object.entries(ALIASES).forEach(([key, names]) => {
      if (out[key] || !names.includes(code)) return;
      out[key] = key.endsWith("date") || key === "date_received" ? toIsoDate(value) : String(value).trim();
      if (!out[key]) delete out[key];
    });
  });
  return out;
};

export const MISSING_TYPE_MESSAGE =
  "The Inward Correspondence document type is not set up yet. Ask an administrator to run add_inward_intake_document_type.sql.";

/**
 * Imports files straight into the chosen file (OCR and AI start server-side right away).
 * Resolves to the per-file results: { filename, success, document_id, ocr_job_id, folio_number, is_duplicate, error }.
 */
export const importIntakeFiles = async (files, folderId, intakeTypeId, onUploadProgress) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  fd.append("default_document_type_id", String(intakeTypeId));
  fd.append("folder_id", String(folderId));
  fd.append("default_confidentiality_level", "INTERNAL");
  fd.append("default_requires_approval", "false");
  const res = await bulkUploadDocuments(fd, onUploadProgress);
  const payload = res?.data ?? res;
  return payload?.results || [];
};

/** Maps a poller entry (or its absence) to the SuggestionNote state. */
export const suggestionState = (entry, hasJob) => {
  if (!hasJob) return "none";
  if (!entry || entry.state === "running") return "running";
  if (entry.state === "failed") return "failed";
  return Object.keys(entry.suggestions || {}).length ? "ready" : "ready-empty";
};

// Why a cross-reference search failed, in words the user can act on.
export const searchFailureMessage = (err) => {
  const status = err?.response?.status;
  if (status === 404) return "The server does not have the cross-reference search yet - restart the EDMS API.";
  return `Search failed${status ? ` (${status})` : ""}: ${err?.response?.data?.message || err?.message || "unknown error"}`;
};
