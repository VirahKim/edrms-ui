import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { getUserSignature, uploadUserSignature, deleteUserSignature } from "../../../../api/signaturesApi";
import SignaturePad from "./SignaturePad";

export default function MyProfile() {
    const navigate = useNavigate();
    // UserContext's UserProvider is never actually mounted anywhere in the
    // app (checked — it'd throw "must be used within a UserProvider" if
    // called), so this reads/writes localStorage directly instead, same as
    // Navbar.jsx itself does for the logged-in user's display name.
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.user_id ?? user?.id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // The full loaded record — role_id/requires_2fa/organization_id aren't
    // shown in this self-service form (changing your own role or 2FA
    // requirement is an admin action, see Users > Edit), but they're kept
    // here so save() can send the complete record back. The API replaces
    // every column on PUT, so anything not included would get wiped.
    const [original, setOriginal] = useState(null);
    const [formData, setFormData] = useState({
        first_name: "",
        other_name: "",
        user_name: "",
        phone_number: "",
        email_address: "",
    });

    const [signature, setSignature] = useState(null);
    const [loadingSignature, setLoadingSignature] = useState(true);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [removingSignature, setRemovingSignature] = useState(false);
    const [signatureError, setSignatureError] = useState("");
    const [signatureMode, setSignatureMode] = useState("upload");

    useEffect(() => {
        if (!userId) {
            setError("Could not determine your user account.");
            setLoading(false);
            return;
        }
        apiClient.get(`/IAmAPI/api/users/${userId}`)
            .then((res) => {
                const u = res.data;
                setOriginal(u);
                setFormData({
                    first_name: u.first_name || "",
                    other_name: u.other_name || "",
                    user_name: u.user_name || "",
                    phone_number: u.phone_number || "",
                    email_address: u.email_address || "",
                });
            })
            .catch(() => setError("Failed to load your profile."))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        setLoadingSignature(true);
        getUserSignature(userId)
            .then(setSignature)
            .catch(() => setSignature(null))
            .finally(() => setLoadingSignature(false));
    }, [userId]);

    const handleSignatureUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploadingSignature(true);
        setSignatureError("");
        try {
            setSignature(await uploadUserSignature(userId, file));
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSignatureError(typeof msg === "string" ? msg : "Failed to upload signature.");
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleDrawnSignature = async (file) => {
        setUploadingSignature(true);
        setSignatureError("");
        try {
            setSignature(await uploadUserSignature(userId, file));
            setSignatureMode("upload");
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSignatureError(typeof msg === "string" ? msg : "Failed to save signature.");
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleSignatureRemove = async () => {
        if (!window.confirm("Remove your signature?")) return;
        setRemovingSignature(true);
        setSignatureError("");
        try {
            await deleteUserSignature(userId);
            setSignature(null);
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSignatureError(typeof msg === "string" ? msg : "Failed to remove signature.");
        } finally {
            setRemovingSignature(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            await apiClient.put(`/IAmAPI/api/users/${userId}`, {
                ...formData,
                role_id: original?.role_id ?? null,
                requires_2fa: original?.requires_2fa ?? false,
            });

            // Keep the navbar/greeting in sync immediately without a re-login —
            // full_name is composed the same way AuthController.Login does it
            // (see AuthController.cs), not stored separately server-side.
            const firstName = formData.first_name.trim();
            const otherName = formData.other_name.trim();
            const full_name = otherName ? `${firstName} ${otherName}` : firstName;
            localStorage.setItem("user", JSON.stringify({
                ...user,
                first_name: formData.first_name,
                other_name: formData.other_name,
                user_name: formData.user_name,
                phone_number: formData.phone_number,
                email_address: formData.email_address,
                full_name,
            }));

            setOriginal((prev) => ({ ...prev, ...formData }));
            setSuccess("Profile updated successfully.");
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.data || "Failed to update your profile. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading your profile...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>
                                <i className="ti ti-user-circle me-2"></i>
                                My Profile
                            </h5>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    <i className="ti ti-check me-2"></i>
                                    {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="first_name" className="form-label">
                                            First Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="first_name"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="other_name" className="form-label">
                                            Other Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="other_name"
                                            name="other_name"
                                            value={formData.other_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="user_name" className="form-label">
                                            Username <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="user_name"
                                            name="user_name"
                                            value={formData.user_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="phone_number" className="form-label">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="phone_number"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="email_address" className="form-label">
                                            Email Address <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email_address"
                                            name="email_address"
                                            value={formData.email_address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Role</label>
                                        <input type="text" className="form-control" value={original?.role_name || "—"} disabled />
                                        <div className="form-text">Contact an administrator to change your role.</div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate(-1)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ti ti-device-floppy me-2"></i>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5>My Signature</h5>
                        </div>
                        <div className="card-body">
                            {signatureError && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {signatureError}
                                    <button type="button" className="btn-close" onClick={() => setSignatureError("")}></button>
                                </div>
                            )}
                            {loadingSignature ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    {signature ? (
                                        <img
                                            src={signature.public_url}
                                            alt="Your signature"
                                            className="border rounded"
                                            style={{ height: 90, background: "#fff", padding: 8 }}
                                        />
                                    ) : (
                                        <div className="border rounded text-muted text-center px-4 py-3">
                                            <i className="ti ti-signature d-block mb-1" style={{ fontSize: "1.5rem", opacity: 0.3 }}></i>
                                            No signature on file
                                        </div>
                                    )}
                                    <div className="d-flex gap-2">
                                        <label className="btn btn-outline-primary btn-sm mb-0">
                                            {uploadingSignature
                                                ? <><span className="spinner-border spinner-border-sm me-1" />Uploading…</>
                                                : <><i className="ti ti-upload me-1"></i>{signature ? "Replace" : "Upload"}</>
                                            }
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/svg+xml"
                                                hidden
                                                onChange={handleSignatureUpload}
                                                disabled={uploadingSignature || removingSignature}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${signatureMode === "draw" ? "btn-primary" : "btn-outline-primary"}`}
                                            onClick={() => setSignatureMode(signatureMode === "draw" ? "upload" : "draw")}
                                            disabled={uploadingSignature || removingSignature}
                                        >
                                            <i className="ti ti-signature me-1"></i>Draw Instead
                                        </button>
                                        {signature && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={handleSignatureRemove}
                                                disabled={uploadingSignature || removingSignature}
                                            >
                                                {removingSignature
                                                    ? <><span className="spinner-border spinner-border-sm me-1" />Removing…</>
                                                    : <><i className="ti ti-trash me-1"></i>Remove</>
                                                }
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {signatureMode === "draw" && !loadingSignature && (
                                <div className="mt-3" style={{ maxWidth: 420 }}>
                                    <small className="text-muted d-block mb-1">
                                        Draw with your mouse, finger, or stylus
                                    </small>
                                    <SignaturePad onSave={handleDrawnSignature} saving={uploadingSignature} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
