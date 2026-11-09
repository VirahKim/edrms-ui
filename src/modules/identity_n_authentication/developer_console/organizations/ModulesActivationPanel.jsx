import React, { useState, useEffect } from 'react';
import apiClient from '../../../../api/apiClient';

const ModulesActivationPanel = ({ organizationId, organizationName, onClose }) => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [changes, setChanges] = useState(new Map());

    useEffect(() => {
        if (organizationId) {
            loadModules();
        }
    }, [organizationId]);

    const loadModules = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/IAmAPI/api/Organizations/${organizationId}/modules`);
            setModules(response.data);
            setChanges(new Map()); // Clear changes after load
        } catch (err) {
            console.error('Failed to load modules:', err);
            setError('Failed to load modules. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (moduleId, isActive) => {
        setChanges(prev => {
            const newChanges = new Map(prev);
            newChanges.set(moduleId, isActive);
            return newChanges;
        });
    };

    const getCurrentState = (module) => {
        return changes.has(module.module_id)
            ? changes.get(module.module_id)
            : module.is_active;
    };

    const hasChange = (moduleId) => {
        return changes.has(moduleId);
    };

    const handleSave = async () => {
        if (changes.size === 0) return;

        try {
            setSaving(true);
            setError(null);

            // Flatten hierarchy: include both parent and child modules in sync request
            const syncRequest = {
                modules: Array.from(changes.entries()).map(([module_id, is_active]) => ({
                    module_id,
                    is_active,
                    config: null
                }))
            };

            console.log('Sending sync request:', syncRequest);

            await apiClient.post(
                `/IAmAPI/api/Organizations/${organizationId}/modules/sync`,
                syncRequest
            );

            await loadModules(); // Reload fresh data
            alert('Modules updated successfully!');
        } catch (err) {
            console.error('Failed to save changes:', err);
            
            let errorMessage = 'Failed to save changes. Please try again.';
            
            if (err.response) {
                // Server responded with error
                const serverError = err.response.data;
                if (serverError && serverError.error) {
                    errorMessage = serverError.error;
                    if (serverError.details) {
                        errorMessage += ': ' + serverError.details;
                    }
                } else {
                    errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`;
                }
            } else if (err.request) {
                // Request made but no response
                errorMessage = 'Network error: Unable to reach the server. Please check your connection.';
            } else {
                // Other errors
                errorMessage = err.message || 'An unexpected error occurred.';
            }
            
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setChanges(new Map());
    };

    const getAllModuleIds = () => {
        const ids = [];
        modules.forEach(parent => {
            ids.push(parent.module_id);
            if (parent.sub_modules && parent.sub_modules.length > 0) {
                parent.sub_modules.forEach(sub => ids.push(sub.module_id));
            }
        });
        return ids;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading modules...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="alert alert-danger">
                        <h6 className="alert-heading">Error</h6>
                        <p>{error}</p>
                        <button className="btn btn-sm btn-danger" onClick={loadModules}>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Count total modules including submodules
    const totalModules = modules.reduce((total, parent) => {
        return total + 1 + (parent.sub_modules ? parent.sub_modules.length : 0);
    }, 0);

    const activeModules = modules.reduce((count, parent) => {
        let active = parent.is_active ? 1 : 0;
        if (parent.sub_modules) {
            active += parent.sub_modules.filter(sub => sub.is_active).length;
        }
        return count + active;
    }, 0);

    const inactiveModules = totalModules - activeModules;

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="card-title mb-0">Module Activation</h5>
                    {organizationName && (
                        <p className="text-muted small mb-0 mt-1">
                            Managing modules for: <strong>{organizationName}</strong>
                        </p>
                    )}
                </div>
                {onClose && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                        <i className="ti ti-x me-1"></i>
                        Close
                    </button>
                )}
            </div>

            <div className="card-body">
                {/* Summary Stats */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="card bg-light">
                            <div className="card-body text-center py-3">
                                <h4 className="mb-0">{totalModules}</h4>
                                <p className="text-muted small mb-0">Total Modules</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-success bg-opacity-10">
                            <div className="card-body text-center py-3">
                                <h4 className="mb-0 text-success">{activeModules}</h4>
                                <p className="text-muted small mb-0">Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-secondary bg-opacity-10">
                            <div className="card-body text-center py-3">
                                <h4 className="mb-0 text-secondary">{inactiveModules}</h4>
                                <p className="text-muted small mb-0">Inactive</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hierarchical Modules List */}
                <div className="module-list">
                    {modules.map(parentModule => {
                        const parentState = getCurrentState(parentModule);
                        const hasParentChange = hasChange(parentModule.module_id);
                        const hasSubModules = parentModule.sub_modules && parentModule.sub_modules.length > 0;

                        return (
                            <div key={parentModule.module_id} className="mb-4">
                                {/* Parent Module */}
                                <div
                                    className={`card ${parentState ? 'border-success' : 'border-secondary'} ${hasParentChange ? 'border-warning border-2' : ''}`}
                                    style={{ transition: 'all 0.2s' }}
                                >
                                    <div className="card-body">
                                        <div className="d-flex align-items-start">
                                            <div className="form-check form-switch me-3 mt-1">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`module-${parentModule.module_id}`}
                                                    checked={parentState}
                                                    onChange={(e) => handleToggle(parentModule.module_id, e.target.checked)}
                                                    disabled={saving}
                                                    style={{ width: '3rem', height: '1.5rem', cursor: 'pointer' }}
                                                />
                                            </div>

                                            <div className="flex-grow-1">
                                                <label
                                                    htmlFor={`module-${parentModule.module_id}`}
                                                    className="d-flex align-items-center mb-2"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {parentModule.module_icon && (
                                                        <i className={`ti ti-${parentModule.module_icon} me-2`} style={{ fontSize: '1.8rem', color: parentState ? '#28a745' : '#6c757d' }}></i>
                                                    )}
                                                    <div>
                                                        <h5 className="mb-0 d-flex align-items-center">
                                                            {parentModule.module_name}
                                                            {hasParentChange && (
                                                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                                                                    CHANGED
                                                                </span>
                                                            )}
                                                            {parentState && (
                                                                <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                                                                    ACTIVE
                                                                </span>
                                                            )}
                                                            {hasSubModules && (
                                                                <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                                                                    {parentModule.sub_modules.length} sub-module{parentModule.sub_modules.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </h5>
                                                        {parentModule.module_description && (
                                                            <p className="text-muted small mb-0">{parentModule.module_description}</p>
                                                        )}
                                                    </div>
                                                </label>

                                                {/* Parent Module Details */}
                                                <div className="row mt-2">
                                                    <div className="col-md-6">
                                                        <small className="text-muted">
                                                            <i className="ti ti-id me-1"></i>
                                                            Module ID: <strong>{parentModule.module_id}</strong>
                                                        </small>
                                                    </div>
                                                    {parentModule.activation_id && (
                                                        <div className="col-md-6">
                                                            <small className="text-muted">
                                                                <i className="ti ti-key me-1"></i>
                                                                Activation ID: <strong>{parentModule.activation_id}</strong>
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>

                                                {parentModule.is_active && parentModule.activated_at && (
                                                    <div className="mt-2">
                                                        <small className="text-muted">
                                                            <i className="ti ti-calendar-check me-1"></i>
                                                            Activated on: <strong>{formatDate(parentModule.activated_at)}</strong>
                                                        </small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sub-modules */}
                                {hasSubModules && (
                                    <div className="ms-4 mt-2">
                                        {parentModule.sub_modules.map(subModule => {
                                            const subState = getCurrentState(subModule);
                                            const hasSubChange = hasChange(subModule.module_id);

                                            return (
                                                <div
                                                    key={subModule.module_id}
                                                    className={`card mb-2 ${subState ? 'border-success' : 'border-secondary'} ${hasSubChange ? 'border-warning border-2' : ''}`}
                                                    style={{ transition: 'all 0.2s', borderLeft: '4px solid', borderLeftColor: subState ? '#28a745' : '#6c757d' }}
                                                >
                                                    <div className="card-body py-2">
                                                        <div className="d-flex align-items-start">
                                                            <div className="form-check form-switch me-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`module-${subModule.module_id}`}
                                                                    checked={subState}
                                                                    onChange={(e) => handleToggle(subModule.module_id, e.target.checked)}
                                                                    disabled={saving}
                                                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                                                />
                                                            </div>

                                                            <div className="flex-grow-1">
                                                                <label
                                                                    htmlFor={`module-${subModule.module_id}`}
                                                                    className="d-flex align-items-center mb-1"
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {subModule.module_icon && (
                                                                        <i className={`ti ti-${subModule.module_icon} me-2`} style={{ fontSize: '1.2rem', color: subState ? '#28a745' : '#6c757d' }}></i>
                                                                    )}
                                                                    <div>
                                                                        <h6 className="mb-0 d-flex align-items-center">
                                                                            {subModule.module_name}
                                                                            {hasSubChange && (
                                                                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>
                                                                                    CHANGED
                                                                                </span>
                                                                            )}
                                                                            {subState && (
                                                                                <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem' }}>
                                                                                    ACTIVE
                                                                                </span>
                                                                            )}
                                                                        </h6>
                                                                        {subModule.module_description && (
                                                                            <p className="text-muted small mb-0" style={{ fontSize: '0.85rem' }}>{subModule.module_description}</p>
                                                                        )}
                                                                    </div>
                                                                </label>

                                                                {/* Sub-module Details */}
                                                                <div className="d-flex flex-wrap gap-3 mt-1">
                                                                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                                        <i className="ti ti-id me-1"></i>
                                                                        ID: <strong>{subModule.module_id}</strong>
                                                                    </small>
                                                                    {subModule.activation_id && (
                                                                        <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                                            <i className="ti ti-key me-1"></i>
                                                                            Activation: <strong>{subModule.activation_id}</strong>
                                                                        </small>
                                                                    )}
                                                                    {subModule.is_active && subModule.activated_at && (
                                                                        <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                                            <i className="ti ti-calendar-check me-1"></i>
                                                                            {formatDate(subModule.activated_at)}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {modules.length === 0 && (
                    <div className="text-center py-5">
                        <i className="ti ti-package text-muted" style={{ fontSize: '4rem' }}></i>
                        <p className="text-muted mt-3">No modules available</p>
                    </div>
                )}
            </div>

            {/* Action Footer */}
            {changes.size > 0 && (
                <div className="card-footer bg-warning bg-opacity-10 border-warning">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <i className="ti ti-alert-circle me-2 text-warning"></i>
                            <strong>{changes.size}</strong> module{changes.size !== 1 ? 's' : ''} modified
                        </div>
                        <div>
                            <button
                                className="btn btn-outline-secondary me-2"
                                onClick={handleDiscard}
                                disabled={saving}
                            >
                                <i className="ti ti-x me-1"></i>
                                Discard Changes
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-device-floppy me-1"></i>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModulesActivationPanel;
