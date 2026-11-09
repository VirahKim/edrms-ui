import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import { getCurrentOrgId, getEsignOtpSetting, updateEsignOtpSetting } from "../../../api/esignOtpApi";

// Org-wide toggle for requiring an emailed OTP before a user can sign or
// stamp a document (or approve-with-signature in a workflow). Enforced
// server-to-server by EDmsAPI/WorkflowsAPI — this page only flips the flag
// they check; it can't be bypassed by skipping the OTP UI client-side.
const EsignSecuritySettings = () => {
  const orgId = getCurrentOrgId();
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    getEsignOtpSetting(orgId)
      .then((r) => setRequired(!!(r?.require_otp_for_esign ?? r?.data?.require_otp_for_esign)))
      .catch(() => toast.error("Failed to load the current setting."))
      .finally(() => setLoading(false));
  }, [orgId]);

  const handleToggle = async (checked) => {
    if (!orgId) return;
    setSaving(true);
    const prev = required;
    setRequired(checked);
    try {
      await updateEsignOtpSetting(orgId, checked);
      toast.success(checked
        ? "OTP verification is now required to sign or stamp documents."
        : "OTP verification is no longer required to sign or stamp documents.");
    } catch (e) {
      setRequired(prev);
      toast.error(e?.response?.data?.message || "Failed to update the setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="mb-3">
          <h4 className="mb-1">Signing &amp; Stamping Security</h4>
          <small className="text-muted">
            Require a one-time code, emailed on the spot, before a user's signature or an org stamp is accepted
            on a document — including approving a workflow step with a signature.
          </small>
        </div>

        <div className="card border-0 shadow-sm" style={{ maxWidth: 640 }}>
          <div className="card-body">
            {!orgId ? (
              <div className="alert alert-warning mb-0">
                <i className="ti ti-alert-triangle me-2"></i>
                Could not determine your organization — please sign in again.
              </div>
            ) : loading ? (
              <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-primary" /></div>
            ) : (
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="requireEsignOtp"
                  checked={required}
                  disabled={saving}
                  onChange={(e) => handleToggle(e.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="requireEsignOtp">
                  Require OTP verification to sign or stamp documents
                </label>
                <div className="form-text">
                  {required
                    ? "Everyone in this organization must verify a code emailed to them before signing, stamping, or approving-with-signature."
                    : "Signing, stamping, and approving-with-signature work without any extra verification step."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EsignSecuritySettings;
