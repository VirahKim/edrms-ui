import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { getCapabilities, setRoleCapabilities } from "../../../../api/capabilitiesApi";

// Color + weight treatment per module nesting level: module (primary) ->
// sub-module (success) -> sub-sub-module and deeper (warning). Capped via
// Math.min in renderModule so any depth still gets a defined style instead
// of falling off the end of the array.
const MODULE_LEVEL_STYLES = [
    { border: "border-primary", bg: "bg-primary-subtle", text: "text-primary", weight: "fw-bold" },
    { border: "border-success", bg: "bg-success-subtle", text: "text-success", weight: "fw-semibold" },
    { border: "border-warning", bg: "bg-warning-subtle", text: "text-warning", weight: "fw-semibold" },
];

export default function RolePermissions() {
const { id } = useParams();
const [role, setRole] = useState(null);
const [hierarchicalPermissions, setHierarchicalPermissions] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [selectedPermissions, setSelectedPermissions] = useState([]);
const [saving, setSaving] = useState(false);
// EDMS capabilities (what the role may do with files) live in the EDMS database, keyed by this role id.
const [capabilities, setCapabilities] = useState([]);
const [selectedCapabilities, setSelectedCapabilities] = useState([]);

const fetchRole = async () => {
    setLoading(true);
    setError("");

    try {
        const response = await apiClient.get(`/IAmAPI/api/roles/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });
        setRole(response.data);
    } catch (err) {
        console.error(err);
        setError("Failed to load role details");
    } finally {
        setLoading(false);
    }
};

const fetchRolePermissions = async () => {
    setLoading(true);
    setError("");

    try {
        const response = await apiClient.get(`/IAmAPI/api/roles/${id}/permissions`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });
        setHierarchicalPermissions(response.data);

        // Extract all assigned permission IDs from the hierarchical structure.
        // Modules can nest to any depth (module -> sub-module -> sub-sub-module
        // -> ...), so this has to walk recursively rather than assuming two
        // fixed levels.
        const assignedIds = [];
        const collectAssigned = (module) => {
            module.resources?.forEach(resource => {
                resource.permissions?.forEach(permission => {
                    if (permission.is_assigned) {
                        assignedIds.push(permission.id);
                    }
                });
            });
            module.sub_modules?.forEach(collectAssigned);
        };
        response.data.forEach(collectAssigned);

        setSelectedPermissions(assignedIds);
    } catch (err) {
        console.error(err);
        setError("Failed to load role permissions");
    } finally {
        setLoading(false);
    }
};

const fetchCapabilities = async () => {
    try {
        const res = await getCapabilities();
        const data = res?.data ?? {};
        setCapabilities(data.capabilities || []);
        setSelectedCapabilities((data.grants || []).find((g) => String(g.role_id) === String(id))?.codes || []);
    } catch (err) {
        // The EDMS service may be unreachable; the rest of the page still works.
        console.error(err);
        setCapabilities([]);
    }
};

useEffect(() => {
    if (id) {
        fetchRole();
        fetchRolePermissions();
        fetchCapabilities();
    }
}, [id]);

    const handleCapabilityToggle = (code, on) => {
        setSelectedCapabilities((prev) => {
            let next = on ? [...prev.filter((c) => c !== code), code] : prev.filter((c) => c !== code);
            // Managing files includes editing them.
            if (on && code === "FILE_MANAGE" && !next.includes("FILE_EDIT")) next = [...next, "FILE_EDIT"];
            if (!on && code === "FILE_EDIT") next = next.filter((c) => c !== "FILE_MANAGE");
            return next;
        });
    };

    const handlePermissionToggle = (permissionId) => {
        setSelectedPermissions((prev) => {
            if (prev.includes(permissionId)) {
                return prev.filter(id => id !== permissionId);
            } else {
                return [...prev, permissionId];
            }
        });
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await apiClient.put(
                `/IAmAPI/api/roles/${id}/permissions`,
                { permission_ids: selectedPermissions },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            // The EDMS capabilities are saved with the rest, so one button saves everything on this page.
            if (capabilities.length > 0) {
                try {
                    await setRoleCapabilities(Number(id), selectedCapabilities);
                } catch (capErr) {
                    console.error(capErr);
                    setError(capErr.response?.data?.message || "The permissions were saved, but the EDMS file permissions could not be.");
                    await fetchRolePermissions();
                    return;
                }
            }
            setSuccess("Permissions updated successfully");
            await fetchRolePermissions();
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Failed to update permissions");
        } finally {
            setSaving(false);
        }
    };

    // Render a module with its resources and permissions. `depth` tracks how
    // deeply nested this module is (module -> sub-module -> ...) so each rung
    // of the hierarchy gets a distinct color/weight from MODULE_LEVEL_STYLES
    // and a bit more indentation, instead of collapsing everything past the
    // first sub-level into the same look.
    const renderModule = (module, depth = 0) => {
        const hasResources = module.resources && module.resources.length > 0;
        const hasSubModules = module.sub_modules && module.sub_modules.length > 0;

        if (!hasResources && !hasSubModules) {
            return null; // Don't render empty modules
        }

        const level = MODULE_LEVEL_STYLES[Math.min(depth, MODULE_LEVEL_STYLES.length - 1)];

        return (
            <div
                className={`rounded overflow-hidden ${depth === 0 ? "mb-2" : "mt-2"}`}
                style={depth === 0 ? undefined : { marginLeft: depth * 16 }}
                key={module.module_id}
            >
                <div className={`border-start border-4 ${level.border} ${level.bg} px-3 py-2`}>
                    <span className={`${level.text} ${level.weight}`} title={module.module_description || undefined}>
                        <i className={`ti ${module.module_icon || (depth === 0 ? "ti-box" : "ti-folder")} me-2`}></i>
                        {module.module_name}
                    </span>
                </div>
                <div style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                    {/* Render resources for this module */}
                    {hasResources && module.resources.map((resource) => {
                        const hasPermissions = resource.permissions && resource.permissions.length > 0;
                        if (!hasPermissions) return null;

                        return (
                            <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 py-2 px-3 border-bottom" key={resource.resource_id}>
                                <div className="flex-shrink-0" style={{ minWidth: 160 }} title={resource.resource_description || resource.resource_name}>
                                    <span className="text-uppercase text-muted fw-semibold" style={{ fontSize: "0.7rem", letterSpacing: "0.03em" }}>
                                        <i className={`ti ${resource.resource_icon || "ti-file"} me-1`}></i>
                                        {resource.resource_name}
                                    </span>
                                </div>
                                <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-1 flex-grow-1">
                                    {resource.permissions.map((permission) => (
                                        <div className="col" key={permission.id}>
                                            <label
                                                className="d-flex align-items-start gap-2 mb-0"
                                                style={{ cursor: "pointer", fontSize: "0.85rem" }}
                                                title={permission.description || permission.name}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input mt-1 flex-shrink-0"
                                                    checked={selectedPermissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                />
                                                <span className="fw-medium">
                                                    {permission.name}
                                                    {permission.action_name && (
                                                        <span className="badge bg-light text-muted border ms-1" style={{ fontSize: "0.65rem" }}>
                                                            <i className="ti ti-key me-1"></i>{permission.action_name}
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Render sub-modules recursively */}
                    {hasSubModules && (
                        <div className="py-2 px-2">
                            {module.sub_modules.map((subModule) => renderModule(subModule, depth + 1))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    {/* Page intro — leads the page so it's the first thing read,
                        before the role card and the permissions tree below it. */}
                    <div className="mb-3">
                        <h4 className="mb-1">Manage Permissions</h4>
                        <p className="text-muted mb-0">
                            Check the boxes to assign permissions to this role. Uncheck to revoke permissions.
                        </p>
                    </div>

                    <div className="card table-card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">Role Permissions: {role?.name}</h5>
                                    {role?.description && (
                                        <small className="text-muted d-block mt-1">{role.description}</small>
                                    )}
                                </div>
                                <Link to="/roles" className="btn btn-primary">
                                    <i className="ti ti-arrow-left"></i> Back to Roles
                                </Link>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger py-2">{error}</div>}
                            {success && <div className="alert alert-success py-2">{success}</div>}

                            {loading ? (
                                <p>
                                    <span className="spinner-grow spinner-grow-sm" role="status"></span> Loading...
                                </p>
                            ) : (
                                <>
                                    {!hierarchicalPermissions || hierarchicalPermissions.length === 0 ? (
                                        <div className="alert alert-warning d-flex align-items-center gap-2">
                                            <i className="ti ti-info-circle"></i>
                                            No permissions available. Please ensure modules, resources, and permissions are configured.
                                        </div>
                                    ) : (
                                        <>
                                            {hierarchicalPermissions.map((module) => renderModule(module))}
                                        </>
                                    )}

                                    {capabilities.length > 0 && (
                                        <div className="rounded overflow-hidden mt-3">
                                            <div className="border-start border-4 border-primary bg-primary-subtle px-3 py-2">
                                                <span className="text-primary fw-bold">
                                                    <i className="ti ti-folders me-2"></i>EDMS file permissions
                                                </span>
                                            </div>
                                            <div className="py-2 px-3 border-bottom">
                                                <div className="text-muted small mb-2">
                                                    What this role may do with files. They follow the role itself, so renaming the role keeps them,
                                                    and they only apply to files the person can already see.
                                                </div>
                                                <div className="row row-cols-1 row-cols-md-2 g-2">
                                                    {capabilities.map((c) => (
                                                        <div className="col" key={c.code}>
                                                            <label className="d-flex align-items-start gap-2 mb-0" style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input mt-1 flex-shrink-0"
                                                                    checked={selectedCapabilities.includes(c.code)}
                                                                    onChange={(e) => handleCapabilityToggle(c.code, e.target.checked)}
                                                                />
                                                                <span>
                                                                    <span className="fw-medium">{c.label}</span>
                                                                    <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>{c.description}</span>
                                                                </span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 border-top pt-3">
                                        <button
                                            className="btn btn-primary btn-lg"
                                            onClick={handleSavePermissions}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner-grow spinner-grow-sm me-2" role="status"></span> Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ti ti-device-floppy me-2"></i> Save Permissions
                                                </>
                                            )}
                                        </button>
                                        <Link to="/roles" className="btn btn-outline-secondary btn-lg ms-2">
                                            <i className="ti ti-x me-2"></i> Cancel
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
