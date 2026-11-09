import { useState } from "react";
import apiClient from "../../../api/apiClient";
import PasswordInput from "../../../components/PasswordInput";

const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

// Self-service "change my own password while logged in" — deliberately has no
// concept of a target user. The backend (POST /api/auth/change-password)
// derives the account to update solely from the caller's JWT, so this can
// never be pointed at anyone else's account. Forgot-password (not logged in)
// is a separate, anonymous flow at /forgot-password — see ForgotPassword.jsx.
const ChangePasswordModal = ({ open, onClose }) => {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    if (!open) return null;

    const handleChange = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleClose = () => {
        setForm(emptyForm);
        setError("");
        setSuccess(false);
        onClose();
    };

    const handleSave = async () => {
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (form.newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }
        if (form.newPassword === form.currentPassword) {
            setError("New password must differ from your current password.");
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await apiClient.post("/IAmAPI/api/auth/change-password", {
                current_password: form.currentPassword,
                new_password: form.newPassword,
            });
            setSuccess(true);
            setForm(emptyForm);
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data;
            setError(typeof msg === "string" ? msg : "Failed to change password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title mb-0">
                            <i className="ti ti-key me-2 text-warning"></i>
                            Change Password
                        </h5>
                        <button className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success ? (
                            <div className="alert alert-success py-2 mb-0">
                                <i className="ti ti-circle-check me-1"></i>
                                Your password has been changed successfully.
                            </div>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Current Password</label>
                                    <PasswordInput
                                        value={form.currentPassword}
                                        onChange={handleChange("currentPassword")}
                                        autoComplete="current-password"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">New Password</label>
                                    <PasswordInput
                                        value={form.newPassword}
                                        onChange={handleChange("newPassword")}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Confirm New Password</label>
                                    <PasswordInput
                                        value={form.confirmPassword}
                                        onChange={handleChange("confirmPassword")}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        {success ? (
                            <button className="btn btn-primary" onClick={handleClose}>Close</button>
                        ) : (
                            <>
                                <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                                <button
                                    className="btn btn-warning"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                                        : <><i className="ti ti-key me-1"></i>Change Password</>
                                    }
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
