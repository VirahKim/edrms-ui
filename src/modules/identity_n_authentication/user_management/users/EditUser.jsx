import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { getUserSignature, uploadUserSignature, deleteUserSignature } from "../../../../api/signaturesApi";
import SignaturePad from "./SignaturePad";
import UserRegistrySelect from "./UserRegistrySelect";
import { getUserRegistries, setUserRegistries } from "../../../../api/edmsApi";

export default function EditUser() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        first_name: "",
        other_name: "",
        user_name: "",
        phone_number: "",
        email_address: "",
        requires_2fa: false,
        role_id: 0,
    });

    const [registryIds, setRegistryIds] = useState([]);       // optional: the registries this user works in
    const [registriesLoaded, setRegistriesLoaded] = useState(false);
    const [registryTouched, setRegistryTouched] = useState(false); // the admin chose registries themselves

    const [signature, setSignature] = useState(null);
    const [loadingSignature, setLoadingSignature] = useState(true);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [removingSignature, setRemovingSignature] = useState(false);
    const [signatureError, setSignatureError] = useState("");
    const [signatureMode, setSignatureMode] = useState("upload");

    useEffect(() => {
        async function loadData() {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch user data
                const userRes = await apiClient.get(`/IAmAPI/api/users/${id}`, { headers });
                const user = userRes.data;

                setFormData({
                    first_name: user.first_name || "",
                    other_name: user.other_name || "",
                    user_name: user.user_name || "",
                    phone_number: user.phone_number || "",
                    email_address: user.email_address || "",
                    requires_2fa: user.requires_2fa || false,
                    role_id: user.role_id || 0,
                });

                // The registries they work in (kept in the EDMS). If this cannot be read the field is left alone on save.
                try {
                    const regRes = await getUserRegistries(id);
                    const list = regRes?.data || [];
                    setRegistryIds(list.map((r) => r.id));
                    setRegistriesLoaded(true);
                } catch {
                    // The current registry could not be read: the field is still offered, and nothing is changed unless chosen.
                    setRegistriesLoaded(false);
                }

                // Fetch roles
                const rolesRes = await apiClient.get("/IAmAPI/api/roles", { headers });
                setRoles(rolesRes.data);

                setLoading(false);
            } catch (err) {
                console.error("Failed to load data", err);
                setError("Failed to load user data. Please try again.");
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    useEffect(() => {
        async function loadSignature() {
            setLoadingSignature(true);
            try {
                const sig = await getUserSignature(id);
                setSignature(sig);
            } catch {
                setSignature(null);
            } finally {
                setLoadingSignature(false);
            }
        }
        loadSignature();
    }, [id]);

    const handleSignatureUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploadingSignature(true);
        setSignatureError("");
        try {
            const sig = await uploadUserSignature(id, file);
            setSignature(sig);
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
            const sig = await uploadUserSignature(id, file);
            setSignature(sig);
            setSignatureMode("upload");
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSignatureError(typeof msg === "string" ? msg : "Failed to save signature.");
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleSignatureRemove = async () => {
        if (!window.confirm("Remove this user's signature?")) return;
        setRemovingSignature(true);
        setSignatureError("");
        try {
            await deleteUserSignature(id);
            setSignature(null);
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSignatureError(typeof msg === "string" ? msg : "Failed to remove signature.");
        } finally {
            setRemovingSignature(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            await apiClient.put(`/IAmAPI/api/users/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            let registryError = "";
            if (registriesLoaded || registryTouched) {
                try {
                    await setUserRegistries(id, registryIds);
                } catch (regErr) {
                    registryError = regErr?.response?.data?.message || "The registries could not be saved.";
                }
            }
            if (registryError) {
                setError(`The user was saved, but the registry was not: ${registryError}`);
            } else {
                setSuccess("User updated successfully!");
                setTimeout(() => {
                    navigate("/users");
                }, 1500);
            }
        } catch (err) {
            console.error("Failed to update user", err);
            setError(err.response?.data?.message || "Failed to update user. Please try again.");
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
                                <p className="mt-2">Loading user data...</p>
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
                            <h5>Edit User</h5>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {error}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setError("")}
                                    ></button>
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    <i className="ti ti-check me-2"></i>
                                    {success}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setSuccess("")}
                                    ></button>
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
                                            Phone Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="phone_number"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            required
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
                                        <label htmlFor="role_id" className="form-label">
                                            Role <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            id="role_id"
                                            name="role_id"
                                            value={formData.role_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select a role</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        {/* Every registry is offered, so one can be chosen even when this user's current one could not be read. */}
                                        <UserRegistrySelect value={registryIds} disabled={submitting}
                                                            onChange={(ids) => { setRegistryIds(ids); setRegistryTouched(true); }} />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="requires_2fa"
                                                name="requires_2fa"
                                                checked={formData.requires_2fa}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="requires_2fa">
                                                Require Two-Factor Authentication (2FA)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate("/users")}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ti ti-device-floppy me-2"></i>
                                                Update User
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5>Signature</h5>
                        </div>
                        <div className="card-body">
                            {signatureError && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {signatureError}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setSignatureError("")}
                                    ></button>
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
                                            alt="User signature"
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
