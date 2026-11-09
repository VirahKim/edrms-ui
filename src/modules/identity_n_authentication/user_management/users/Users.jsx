import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { getUserSignature, uploadUserSignature, deleteUserSignature } from "../../../../api/signaturesApi";
import SignaturePad from "./SignaturePad";

export default function Users() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deactivatingIds, setDeactivatingIds] = useState([]);
    const [deactivatedIds, setDeactivatedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [ouModal, setOuModal] = useState({
        open: false, userId: null, userName: "",
        loading: false, orgUnits: [], ouTypes: [], selected: new Set(), saving: false,
    });
    const [ouSearch, setOuSearch] = useState("");

    const [resetModal, setResetModal] = useState({
        open: false, userId: null, userName: "", emailOrUsername: "",
        sent: false, sending: false, error: "",
    });

    const [sigModal, setSigModal] = useState({
        open: false, userId: null, userName: "",
        loading: false, signature: null, uploading: false, removing: false, error: "",
    });
    const [sigMode, setSigMode] = useState("upload");

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const res = await apiClient.get("/IAmAPI/api/users");
                const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
                setData(list);
                setFilteredData(list);
            } catch (err) {
                console.error("Failed to fetch data", err);
                alert("Failed to load users. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredData(data);
        } else {
            const q = searchTerm.toLowerCase();
            setFilteredData(data.filter((item) =>
                item.first_name?.toLowerCase().includes(q) ||
                item.other_name?.toLowerCase().includes(q) ||
                item.phone_number?.toLowerCase().includes(q) ||
                item.email_address?.toLowerCase().includes(q) ||
                item.role_name?.toLowerCase().includes(q) ||
                item.user_name?.toLowerCase().includes(q)
            ));
        }
        setCurrentPage(1);
    }, [searchTerm, data]);

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
        setSortConfig({ key, direction });
        setFilteredData((prev) =>
            [...prev].sort((a, b) => {
                if (a[key] == null) return 1;
                if (b[key] == null) return -1;
                if (typeof a[key] === "string")
                    return direction === "asc" ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
                return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
            })
        );
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleEditUser = (id) => navigate(`/users/edit/${id}`);

    async function deactivateUser(id) {
        if (!window.confirm("Deactivate this account?")) return;
        if (deactivatingIds.includes(id) || deactivatedIds.includes(id)) return;
        setDeactivatingIds((prev) => [...prev, id]);
        try {
            await apiClient.delete(`/IAmAPI/api/users/${id}`);
            setData((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
            setFilteredData((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
            setDeactivatedIds((prev) => [...prev, id]);
            alert("Account deactivated successfully");
        } catch (err) {
            console.error("Failed to deactivate user", err);
            alert("Failed to deactivate account. See console for details.");
        } finally {
            setDeactivatingIds((prev) => prev.filter((i) => i !== id));
        }
    }

    // ── OU Mapping ──────────────────────────────────────────────────────────────

    async function openOuModal(user) {
        setOuSearch("");
        setOuModal({
            open: true,
            userId: user.id,
            userName: `${user.first_name || ""} ${user.other_name || ""}`.trim(),
            loading: true, orgUnits: [], ouTypes: [], selected: new Set(), saving: false,
        });
        try {
            const [ouRes, assignedRes, typesRes] = await Promise.all([
                apiClient.get("/IAmAPI/api/OrganisationalUnits"),
                apiClient.get(`/IAmAPI/api/users/${user.id}/organisational-units`),
                apiClient.get("/IAmAPI/api/OuTypes"),
            ]);
            const assignedIds = new Set((assignedRes.data || []).map((o) => o.ou_id));
            setOuModal((prev) => ({
                ...prev, loading: false,
                orgUnits: ouRes.data || [],
                ouTypes: typesRes.data || [],
                selected: assignedIds,
            }));
        } catch {
            setOuModal((prev) => ({ ...prev, loading: false }));
            alert("Failed to load organizational units.");
        }
    }

    function toggleOu(id) {
        setOuModal((prev) => {
            const next = new Set(prev.selected);
            if (next.has(id)) next.delete(id); else next.add(id);
            return { ...prev, selected: next };
        });
    }

    async function saveOuAssignments() {
        setOuModal((prev) => ({ ...prev, saving: true }));
        try {
            await apiClient.put(`/IAmAPI/api/users/${ouModal.userId}/organisational-units`, {
                ou_ids: [...ouModal.selected],
            });
            setOuModal((prev) => ({ ...prev, open: false, saving: false }));
        } catch {
            setOuModal((prev) => ({ ...prev, saving: false }));
            alert("Failed to update OU assignments.");
        }
    }

    function closeOuModal() {
        setOuModal((prev) => ({ ...prev, open: false }));
    }

    // ── Password Reset ───────────────────────────────────────────────────────────
    // Note: there is deliberately no admin "Change Password" action here — the
    // change-password endpoint is JWT-scoped to the caller and cannot act on
    // another user's account. To help a user who forgot/lost access to their
    // password, use Reset Password below (the same anonymous flow a user
    // reaches from "Forgot Password?" on the login page).

    function openResetModal(user) {
        setResetModal({
            open: true, userId: user.id,
            userName: `${user.first_name || ""} ${user.other_name || ""}`.trim(),
            emailOrUsername: user.email_address || user.user_name || "",
            sent: false, sending: false, error: "",
        });
    }

    function closeResetModal() {
        setResetModal((prev) => ({ ...prev, open: false }));
    }

    // Sends the same emailed reset link a user gets from "Forgot Password?" on
    // the login page. This is the only step an admin performs — the target
    // user sets their own new password by following the link, so the admin
    // never sees or chooses a password on someone else's behalf.
    async function sendResetLink() {
        setResetModal((prev) => ({ ...prev, sending: true, error: "" }));
        try {
            await apiClient.post("/IAmAPI/api/auth/request-password-reset", {
                email_or_username: resetModal.emailOrUsername,
            });
            setResetModal((prev) => ({ ...prev, sending: false, sent: true }));
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data;
            setResetModal((prev) => ({ ...prev, sending: false, error: typeof msg === "string" ? msg : "Failed to send reset link." }));
        }
    }

    // ── Signature Management ─────────────────────────────────────────────────────

    async function openSigModal(user) {
        setSigMode("upload");
        setSigModal({
            open: true, userId: user.id,
            userName: `${user.first_name || ""} ${user.other_name || ""}`.trim(),
            loading: true, signature: null, uploading: false, removing: false, error: "",
        });
        try {
            const sig = await getUserSignature(user.id);
            setSigModal((prev) => ({ ...prev, loading: false, signature: sig }));
        } catch {
            setSigModal((prev) => ({ ...prev, loading: false, signature: null }));
        }
    }

    function closeSigModal() {
        setSigModal((prev) => ({ ...prev, open: false }));
    }

    async function handleSigUpload(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setSigModal((prev) => ({ ...prev, uploading: true, error: "" }));
        try {
            const sig = await uploadUserSignature(sigModal.userId, file);
            setSigModal((prev) => ({ ...prev, uploading: false, signature: sig }));
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSigModal((prev) => ({ ...prev, uploading: false, error: typeof msg === "string" ? msg : "Failed to upload signature." }));
        }
    }

    async function handleSigDrawn(file) {
        setSigModal((prev) => ({ ...prev, uploading: true, error: "" }));
        try {
            const sig = await uploadUserSignature(sigModal.userId, file);
            setSigModal((prev) => ({ ...prev, uploading: false, signature: sig }));
            setSigMode("upload");
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSigModal((prev) => ({ ...prev, uploading: false, error: typeof msg === "string" ? msg : "Failed to save signature." }));
        }
    }

    async function handleSigRemove() {
        if (!window.confirm("Remove this user's signature?")) return;
        setSigModal((prev) => ({ ...prev, removing: true, error: "" }));
        try {
            await deleteUserSignature(sigModal.userId);
            setSigModal((prev) => ({ ...prev, removing: false, signature: null }));
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message;
            setSigModal((prev) => ({ ...prev, removing: false, error: typeof msg === "string" ? msg : "Failed to remove signature." }));
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <DashboardLayout>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 text-muted">Loading users...</p>
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
                    <div className="card table-card">
                        <div className="card-header">
                            <h5>Users</h5>
                        </div>
                        <div className="card-body p-3">
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <div className="input-group">
                                        <span className="input-group-text"><i className="ti ti-search"></i></span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={() => navigate('/users/create')}
                                    >
                                        <i className="ti ti-user-plus me-1"></i> Create User
                                    </button>
                                </div>
                                <div className="col-md-2">
                                    <select
                                        className="form-select"
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                        <option value={100}>100 per page</option>
                                    </select>
                                </div>
                                <div className="col-md-3 text-end">
                                    <span className="text-muted">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} users
                                    </span>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                                                ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th onClick={() => handleSort("first_name")} style={{ cursor: "pointer" }}>
                                                Name {sortConfig.key === "first_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th onClick={() => handleSort("phone_number")} style={{ cursor: "pointer" }}>
                                                Phone {sortConfig.key === "phone_number" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th onClick={() => handleSort("email_address")} style={{ cursor: "pointer" }}>
                                                Email {sortConfig.key === "email_address" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th onClick={() => handleSort("role_name")} style={{ cursor: "pointer" }}>
                                                Role {sortConfig.key === "role_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th onClick={() => handleSort("is_active")} style={{ cursor: "pointer" }}>
                                                Status {sortConfig.key === "is_active" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th>Last Login</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">
                                                    <i className="ti ti-users-off" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                                                    <p className="text-muted mt-2">No users found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            currentItems.map((item) => {
                                                const isDeactivating = deactivatingIds.includes(item.id);
                                                const isDeactivated = deactivatedIds.includes(item.id) || item.is_active === false;
                                                return (
                                                    <tr key={item.id}>
                                                        <td>{item.id}</td>
                                                        <td>{item.first_name} {item.other_name}</td>
                                                        <td>{item.phone_number}</td>
                                                        <td>{item.email_address}</td>
                                                        <td>{item.role_name}</td>
                                                        <td>
                                                            <span className={`badge ${item.is_active ? "bg-success" : "bg-danger"}`}>
                                                                {item.is_active ? "ACTIVE" : "LOCKED"}
                                                            </span>
                                                        </td>
                                                        <td>{item.last_login_at ? new Date(item.last_login_at).toLocaleString() : "Never"}</td>
                                                        <td>
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-primary"
                                                                    onClick={() => handleEditUser(item.id)}
                                                                    title="Edit User"
                                                                >
                                                                    <i className="ti ti-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => openOuModal(item)}
                                                                    title="Assign Org Units"
                                                                >
                                                                    <i className="ti ti-sitemap"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-info"
                                                                    onClick={() => openResetModal(item)}
                                                                    title="Reset Password"
                                                                >
                                                                    <i className="ti ti-lock-access"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => openSigModal(item)}
                                                                    title="Manage Signature"
                                                                >
                                                                    <i className="ti ti-signature"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger"
                                                                    onClick={() => deactivateUser(item.id)}
                                                                    disabled={isDeactivating || isDeactivated}
                                                                    title="Deactivate User"
                                                                >
                                                                    {isDeactivating
                                                                        ? <span className="spinner-border spinner-border-sm"></span>
                                                                        : <i className="ti ti-lock"></i>}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <nav className="mt-3">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, index) => {
                                            const pageNumber = index + 1;
                                            if (
                                                pageNumber === 1 ||
                                                pageNumber === totalPages ||
                                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                            ) {
                                                return (
                                                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? "active" : ""}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(pageNumber)}>
                                                            {pageNumber}
                                                        </button>
                                                    </li>
                                                );
                                            } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                                return <li key={pageNumber} className="page-item disabled"><span className="page-link">...</span></li>;
                                            }
                                            return null;
                                        })}
                                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
            {resetModal.open && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title mb-0">
                                        <i className="ti ti-lock-access me-2 text-info"></i>
                                        Reset Password
                                    </h5>
                                    <p className="text-muted small mb-0 mt-1">{resetModal.userName}</p>
                                </div>
                                <button className="btn-close" onClick={closeResetModal}></button>
                            </div>
                            <div className="modal-body">
                                {resetModal.error && (
                                    <div className="alert alert-danger py-2">{resetModal.error}</div>
                                )}
                                {resetModal.sent ? (
                                    <div className="alert alert-success py-2 mb-0">
                                        <i className="ti ti-circle-check me-1"></i>
                                        A password reset link has been emailed to <strong>{resetModal.emailOrUsername}</strong>.
                                        The user sets their own new password by following the link — you're done here.
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-muted small mb-3">
                                            A password reset link will be emailed to <strong>{resetModal.emailOrUsername || "the user"}</strong>.
                                            They'll set their own new password by clicking it — you won't see or choose it.
                                        </p>
                                        <div className="mb-3">
                                            <label className="form-label">Email or Username</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={resetModal.emailOrUsername}
                                                onChange={(e) => setResetModal((prev) => ({ ...prev, emailOrUsername: e.target.value }))}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                {resetModal.sent ? (
                                    <button className="btn btn-primary" onClick={closeResetModal}>Close</button>
                                ) : (
                                    <>
                                        <button className="btn btn-secondary" onClick={closeResetModal}>Cancel</button>
                                        <button
                                            className="btn btn-info text-white"
                                            onClick={sendResetLink}
                                            disabled={resetModal.sending || !resetModal.emailOrUsername}
                                        >
                                            {resetModal.sending
                                                ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</>
                                                : <><i className="ti ti-send me-1"></i>Send Reset Link</>
                                            }
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Signature Management Modal ──────────────────────────────────────── */}
            {sigModal.open && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title mb-0">
                                        <i className="ti ti-signature me-2 text-primary"></i>
                                        Manage Signature
                                    </h5>
                                    <p className="text-muted small mb-0 mt-1">{sigModal.userName}</p>
                                </div>
                                <button className="btn-close" onClick={closeSigModal}></button>
                            </div>
                            <div className="modal-body">
                                {sigModal.error && (
                                    <div className="alert alert-danger py-2">{sigModal.error}</div>
                                )}
                                {sigModal.loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                        <p className="text-muted small mb-0 mt-2">Loading signature…</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        {sigModal.signature ? (
                                            <img
                                                src={sigModal.signature.public_url}
                                                alt="User signature"
                                                className="border rounded mb-3"
                                                style={{ maxHeight: 140, maxWidth: "100%", background: "#fff", padding: 8 }}
                                            />
                                        ) : (
                                            <div className="border rounded mb-3 py-4 text-muted">
                                                <i className="ti ti-signature d-block mb-2" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                                                No signature on file
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-center gap-2">
                                            <label className="btn btn-outline-primary btn-sm mb-0">
                                                {sigModal.uploading
                                                    ? <><span className="spinner-border spinner-border-sm me-1" />Uploading…</>
                                                    : <><i className="ti ti-upload me-1"></i>{sigModal.signature ? "Replace" : "Upload"}</>
                                                }
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/svg+xml"
                                                    hidden
                                                    onChange={handleSigUpload}
                                                    disabled={sigModal.uploading || sigModal.removing}
                                                />
                                            </label>
                                            <button
                                                className={`btn btn-sm ${sigMode === "draw" ? "btn-primary" : "btn-outline-primary"}`}
                                                onClick={() => setSigMode(sigMode === "draw" ? "upload" : "draw")}
                                                disabled={sigModal.uploading || sigModal.removing}
                                            >
                                                <i className="ti ti-signature me-1"></i>Draw Instead
                                            </button>
                                            {sigModal.signature && (
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={handleSigRemove}
                                                    disabled={sigModal.uploading || sigModal.removing}
                                                >
                                                    {sigModal.removing
                                                        ? <><span className="spinner-border spinner-border-sm me-1" />Removing…</>
                                                        : <><i className="ti ti-trash me-1"></i>Remove</>
                                                    }
                                                </button>
                                            )}
                                        </div>
                                        {sigMode === "draw" && (
                                            <div className="mt-3 text-start mx-auto" style={{ maxWidth: 420 }}>
                                                <small className="text-muted d-block mb-1">
                                                    Draw with your mouse, finger, or stylus
                                                </small>
                                                <SignaturePad onSave={handleSigDrawn} saving={sigModal.uploading} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeSigModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── OU Assignment Modal ─────────────────────────────────────────────── */}
            {ouModal.open && (() => {
                const q = ouSearch.trim().toLowerCase();
                const allUnits = ouModal.orgUnits;

                // Stable filter — no re-sort, items never jump position
                const filtered = q
                    ? allUnits.filter(ou =>
                        ou.name?.toLowerCase().includes(q) ||
                        ou.code?.toLowerCase().includes(q)
                    )
                    : allUnits;

                // Group by type, stable insertion order
                const typeMap = Object.fromEntries(ouModal.ouTypes.map(t => [t.id, t]));
                const groupMap = new Map();
                filtered.forEach(ou => {
                    const key = ou.ou_type_id ?? "__none__";
                    if (!groupMap.has(key)) groupMap.set(key, { type: typeMap[key] ?? null, units: [] });
                    groupMap.get(key).units.push(ou);
                });
                // Named type groups alphabetically, Unclassified last
                const groups = [...groupMap.entries()]
                    .sort(([aKey, aVal], [bKey, bVal]) => {
                        if (aKey === "__none__") return 1;
                        if (bKey === "__none__") return -1;
                        return (aVal.type?.name ?? "").localeCompare(bVal.type?.name ?? "");
                    })
                    .map(([, g]) => g);

                const allFilteredSelected = filtered.length > 0 && filtered.every(ou => ouModal.selected.has(ou.id));

                const toggleGroup = (units) => {
                    setOuModal(prev => {
                        const next = new Set(prev.selected);
                        const allIn = units.every(u => next.has(u.id));
                        units.forEach(u => allIn ? next.delete(u.id) : next.add(u.id));
                        return { ...prev, selected: next };
                    });
                };

                const OuRow = ({ ou }) => {
                    const checked = ouModal.selected.has(ou.id);
                    const flags = [
                        ou.is_sales_point      && { label: "Sales",      color: "success" },
                        ou.is_hr_unit          && { label: "HR",         color: "primary" },
                        ou.is_stock_location   && { label: "Stock",      color: "info"    },
                        ou.is_production_unit  && { label: "Production", color: "warning" },
                    ].filter(Boolean);

                    return (
                        <div
                            onClick={() => toggleOu(ou.id)}
                            style={{
                                cursor: "pointer", userSelect: "none",
                                ...(checked ? {} : { backgroundColor: "var(--bs-card-bg, #fff)" }),
                            }}
                            className={`d-flex align-items-center gap-3 rounded px-3 py-2 mb-1 border ${
                                checked ? "border-primary bg-light-primary" : "border"
                            }`}
                        >
                            {/* Custom checkbox */}
                            <div style={{
                                width: 18, height: 18, flexShrink: 0, borderRadius: 4,
                                border: checked ? "none" : "2px solid #ced4da",
                                background: checked ? "var(--bs-primary)" : "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background .15s",
                            }}>
                                {checked && <i className="ti ti-check text-white" style={{ fontSize: 12 }}></i>}
                            </div>

                            {/* Name + code + flags */}
                            <div className="flex-grow-1 min-w-0">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className={`fw-medium ${checked ? "text-primary" : ""}`}>{ou.name}</span>
                                    {ou.code && (
                                        <code className="px-1 rounded" style={{
                                            background: checked ? "rgba(var(--bs-primary-rgb),.12)" : "#e9ecef",
                                            fontSize: "0.68rem",
                                        }}>
                                            {ou.code}
                                        </code>
                                    )}
                                </div>
                                {flags.length > 0 && (
                                    <div className="d-flex gap-1 mt-1 flex-wrap">
                                        {flags.map(f => (
                                            <span key={f.label} className={`badge bg-light-${f.color} text-${f.color}`} style={{ fontSize: "0.62rem" }}>
                                                {f.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {checked && (
                                <i className="ti ti-circle-check text-primary ms-auto" style={{ fontSize: 16, flexShrink: 0 }}></i>
                            )}
                        </div>
                    );
                };

                return (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">

                                {/* Header */}
                                <div className="modal-header border-bottom-0 pb-0">
                                    <div>
                                        <h5 className="modal-title mb-0">
                                            <i className="ti ti-sitemap me-2 text-primary"></i>
                                            Assign Org Units
                                        </h5>
                                        <p className="text-muted small mb-0 mt-1">{ouModal.userName}</p>
                                    </div>
                                    <button className="btn-close" onClick={closeOuModal}></button>
                                </div>

                                <div className="modal-body pt-3">
                                    {ouModal.loading ? (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary mb-3" role="status"></div>
                                            <p className="text-muted mb-0">Loading organizational units…</p>
                                        </div>
                                    ) : allUnits.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <i className="ti ti-sitemap d-block mb-3" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                                            <p className="mb-1 fw-medium">No organizational units found</p>
                                            <p className="small mb-0">Create units in Organization Structure first.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Search + global Select All */}
                                            <div className="d-flex gap-2 mb-3">
                                                <div className="input-group flex-grow-1">
                                                    <span className="input-group-text bg-transparent border-end-0">
                                                        <i className="ti ti-search text-muted"></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control border-start-0 ps-0"
                                                        placeholder="Search by name or code…"
                                                        value={ouSearch}
                                                        onChange={e => setOuSearch(e.target.value)}
                                                        autoFocus
                                                    />
                                                    {ouSearch && (
                                                        <button className="btn btn-outline-secondary" onClick={() => setOuSearch("")}>
                                                            <i className="ti ti-x"></i>
                                                        </button>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-outline-primary btn-sm text-nowrap"
                                                    onClick={() => setOuModal(prev => {
                                                        const next = new Set(prev.selected);
                                                        filtered.forEach(ou => allFilteredSelected ? next.delete(ou.id) : next.add(ou.id));
                                                        return { ...prev, selected: next };
                                                    })}
                                                >
                                                    {allFilteredSelected ? "Clear All" : "Select All"}
                                                </button>
                                            </div>

                                            {/* Summary bar */}
                                            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                                                <span className="text-muted small">
                                                    {q ? `${filtered.length} of ${allUnits.length} units match` : `${allUnits.length} units`}
                                                </span>
                                                <span className={`badge rounded-pill ${ouModal.selected.size > 0 ? "bg-primary" : "bg-secondary bg-opacity-25 text-secondary"}`}>
                                                    {ouModal.selected.size} selected
                                                </span>
                                            </div>

                                            {filtered.length === 0 ? (
                                                <div className="text-center py-4 text-muted">
                                                    <i className="ti ti-search d-block mb-2" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                                                    No units match <strong>"{ouSearch}"</strong>
                                                </div>
                                            ) : (
                                                <div style={{ maxHeight: 400, overflowY: "auto", overflowX: "hidden" }}>
                                                    {groups.map(({ type, units }) => {
                                                        const groupAllSelected = units.every(u => ouModal.selected.has(u.id));
                                                        const groupSomeSelected = units.some(u => ouModal.selected.has(u.id));
                                                        return (
                                                            <div key={type?.id ?? "__none__"} className="mb-3">
                                                                {/* Group header */}
                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                    {/* Group checkbox */}
                                                                    <div
                                                                        onClick={() => toggleGroup(units)}
                                                                        style={{
                                                                            width: 16, height: 16, flexShrink: 0, borderRadius: 3, cursor: "pointer",
                                                                            border: groupAllSelected ? "none" : groupSomeSelected ? "2px solid var(--bs-primary)" : "2px solid #adb5bd",
                                                                            background: groupAllSelected ? "var(--bs-primary)" : groupSomeSelected ? "rgba(var(--bs-primary-rgb),.15)" : "#fff",
                                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        {groupAllSelected && <i className="ti ti-check text-white" style={{ fontSize: 10 }}></i>}
                                                                        {groupSomeSelected && !groupAllSelected && <span style={{ width: 8, height: 2, background: "var(--bs-primary)", borderRadius: 1 }}></span>}
                                                                    </div>

                                                                    <span className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: ".05em" }}>
                                                                        {type ? type.name : "Unclassified"}
                                                                    </span>
                                                                    <span className="badge bg-light text-secondary border ms-1" style={{ fontSize: "0.65rem" }}>
                                                                        {units.length}
                                                                    </span>
                                                                    <div style={{ flex: 1, height: 1, background: "#e9ecef" }}></div>
                                                                    <button
                                                                        className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                                                                        style={{ fontSize: "0.75rem" }}
                                                                        onClick={() => toggleGroup(units)}
                                                                    >
                                                                        {groupAllSelected ? "Clear" : "Select all"}
                                                                    </button>
                                                                </div>

                                                                {/* Units — stable order, no re-sort on toggle */}
                                                                {units.map(ou => <OuRow key={ou.id} ou={ou} />)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={closeOuModal}>Cancel</button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={saveOuAssignments}
                                        disabled={ouModal.saving || ouModal.loading}
                                    >
                                        {ouModal.saving
                                            ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                                            : <><i className="ti ti-device-floppy me-1"></i>Save Assignments</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </DashboardLayout>
    );
}
