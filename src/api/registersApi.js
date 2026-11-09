import apiClient from "./apiClient";

const BASE = "/EDMSApi/api";

// ── parties (sources and destinations) ─────────────────────────────────
export const listParties = (kind) =>
  apiClient.get(`${BASE}/registers/parties`, { params: kind ? { kind } : {} }).then((r) => r.data);

export const createParty = (body) =>
  apiClient.post(`${BASE}/registers/parties`, body).then((r) => r.data);

// Mail Senders management: every name (active or not) with its usage; rename / switch off.
export const listPartiesForManagement = () =>
  apiClient.get(`${BASE}/registers/parties/manage`).then((r) => r.data);

export const updateParty = (id, body) =>
  apiClient.put(`${BASE}/registers/parties/${id}`, body).then((r) => r.data);

// ── inward and outward registers ───────────────────────────────────────
const registerPath = (kind) => `${BASE}/registers/${kind}`;

export const listRegister = (kind, filters = {}) =>
  apiClient.get(registerPath(kind), { params: filters }).then((r) => r.data);

export const createRegisterEntry = (kind, body) =>
  apiClient.post(registerPath(kind), body).then((r) => r.data);

export const voidRegisterEntry = (kind, id, reason) =>
  apiClient.post(`${registerPath(kind)}/${id}/void`, { reason }).then((r) => r.data);

export const linkRegisterDocument = (kind, id, documentId) =>
  apiClient.post(`${registerPath(kind)}/${id}/link-document`, { document_id: documentId }).then((r) => r.data);

/** Downloads the register as an Excel file, using the same filters as the list. */
export const downloadRegisterExcel = async (kind, filters = {}) => {
  const res = await apiClient.get(`${registerPath(kind)}/export`, { params: filters, responseType: "blob" });
  const disposition = res.headers?.["content-disposition"] || "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match ? match[1] : `${kind}-register.xlsx`;
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ── physical files (the File Movement Register) ────────────────────────
const physicalPath = `${BASE}/physical-files`;

export const listPhysicalFiles = (filters = {}) =>
  apiClient.get(physicalPath, { params: filters }).then((r) => r.data);

export const handOverPhysicalFile = (body) =>
  apiClient.post(physicalPath, body).then((r) => r.data);

export const receivePhysicalFile = (id) =>
  apiClient.post(`${physicalPath}/${id}/receive`).then((r) => r.data);

export const returnPhysicalFile = (id) =>
  apiClient.post(`${physicalPath}/${id}/return`).then((r) => r.data);

// rackLocation: where the file is shelved after it comes back (optional).
export const acknowledgePhysicalReturn = (id, rackLocation) =>
  apiClient.post(`${physicalPath}/${id}/acknowledge-return`, { rack_location: rackLocation || null }).then((r) => r.data);

// Send letters outside the organisation: one Outward Mail Register entry each, to a sender already in the
// Inward Mail Register. body: { document_ids, destination_party_id, dispatch_mode, date_dispatched?, our_ref_no?, remarks?, item_type? }
export const sendOutside = (body) =>
  apiClient.post(`${registerPath("outward")}/send-outside`, body).then((r) => r.data);
