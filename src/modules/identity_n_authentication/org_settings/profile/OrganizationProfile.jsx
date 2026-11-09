import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import apiClient from "../../../../api/apiClient";
import { getCurrentOrgId } from "../../../../api/esignOtpApi";

function Alert({ type, message, onClose }) {
    if (!message) return null;
    return (
        <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
            <i className={`ti ${type === "danger" ? "ti-alert-circle" : "ti-circle-check"} me-2`}></i>
            {message}
            <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
    );
}

// This page only edits profile/contact/address fields. Deliberately excludes
// subscription/billing/module-activation fields (subscription_plan,
// billing_frequency, trial dates, modules_subscribed) and type_id/is_active
// — those are platform-admin concerns (see developer_console/organizations),
// not something this self-service page should let anyone change. The PUT
// endpoint replaces the whole row, so those fields still get sent back
// unchanged from the loaded record rather than omitted.

export default function OrganizationProfile() {
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const orgId = getCurrentOrgId();

    useEffect(() => {
        if (!orgId) {
            setError("No organization is associated with your account.");
            setLoading(false);
            return;
        }
        apiClient.get(`/IAmAPI/api/Organizations/${orgId}`)
            .then((res) => {
                setOrg(res.data);
                setForm(res.data);
            })
            .catch(() => setError("Failed to load organization details."))
            .finally(() => setLoading(false));
    }, [orgId]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        setError(""); setSuccess("");
        try {
            // Send the full record back (org + edited fields) — the API
            // replaces every column on PUT, so anything not included here
            // (subscription/billing/type_id/is_active) must still be present
            // with its original value or it gets wiped.
            await apiClient.put(`/IAmAPI/api/Organizations/${orgId}`, { ...org, ...form, id: orgId });
            setOrg(form);
            setSuccess("Organization profile updated.");
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.data || "Failed to save organization profile.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-3 text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="px-3">
                <div className="row">
                    <div className="col-12">
                        <div className="page-header">
                            <div className="page-block">
                                <div className="row align-items-center">
                                    <div className="col-md-12">
                                        <nav aria-label="breadcrumb">
                                            <ol className="breadcrumb mb-1">
                                                <li className="breadcrumb-item">
                                                    <span className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate("/org-settings")}>
                                                        Organization Settings
                                                    </span>
                                                </li>
                                                <li className="breadcrumb-item active">Organization Profile</li>
                                            </ol>
                                        </nav>
                                        <h2 className="mb-0">
                                            <i className="ti ti-building me-2"></i>
                                            Organization Profile
                                        </h2>
                                        <p className="text-muted mt-1 mb-0">
                                            Details, contact information, and address for your organization.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Alert type="danger" message={error} onClose={() => setError("")} />
                <Alert type="success" message={success} onClose={() => setSuccess("")} />

                {form && (
                    <form onSubmit={save}>
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="mb-0">Company Information</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Organization Name <span className="text-danger">*</span></label>
                                                <input className="form-control" required value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Legal Name</label>
                                                <input className="form-control" value={form.legal_name || ""} onChange={(e) => set("legal_name", e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Registration Number</label>
                                                <input className="form-control" value={form.registration_number || ""} onChange={(e) => set("registration_number", e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Website</label>
                                                <input className="form-control" placeholder="https://example.com" value={form.website || ""} onChange={(e) => set("website", e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Domain</label>
                                                <input className="form-control" value={form.domain || ""} onChange={(e) => set("domain", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="mb-0">Contact Details</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Contact Person</label>
                                                <input className="form-control" value={form.contact_person || ""} onChange={(e) => set("contact_person", e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Contact Email</label>
                                                <input type="email" className="form-control" value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Contact Phone</label>
                                                <input className="form-control" value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="mb-0">Address</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Address Line 1</label>
                                                <input className="form-control" value={form.address_line1 || ""} onChange={(e) => set("address_line1", e.target.value)} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Address Line 2</label>
                                                <input className="form-control" value={form.address_line2 || ""} onChange={(e) => set("address_line2", e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">City</label>
                                                <input className="form-control" value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">State / Region</label>
                                                <input className="form-control" value={form.state || ""} onChange={(e) => set("state", e.target.value)} />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Postal Code</label>
                                                <input className="form-control" value={form.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Country</label>
                                                <input className="form-control" value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mb-4">
                            <button type="submit" className="btn btn-primary" disabled={saving || !form.name}>
                                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-device-floppy me-1"></i>}
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}
