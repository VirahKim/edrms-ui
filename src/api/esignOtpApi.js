import apiClient from "./apiClient";

const BASE = "/IAmAPI/api";

// Digital signing/stamping OTP — an org-level opt-in (Organizations.
// require_otp_for_esign) enforced server-to-server by EDmsAPI/WorkflowsAPI
// before accepting a sign/stamp/approve-with-signature action. These calls
// only ever act on the CURRENTLY authenticated user (from their own bearer
// token) — there's no user_id parameter to pass.

export const getCurrentOrgId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.organisation_id || u?.organization_id || null;
  } catch {
    return null;
  }
};

// purpose: "SIGN" | "STAMP" | "APPROVE" — cosmetic only, shapes the email wording.
export const requestEsignOtp = (purpose) =>
  apiClient.post(`${BASE}/esign-otp/request`, { purpose }).then((r) => r.data);

export const getEsignOtpSetting = (orgId) =>
  apiClient.get(`${BASE}/organizations/${orgId}/esign-otp-setting`).then((r) => r.data);

export const updateEsignOtpSetting = (orgId, required) =>
  apiClient
    .put(`${BASE}/organizations/${orgId}/esign-otp-setting`, { require_otp_for_esign: required })
    .then((r) => r.data);
