import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import {
    getWorkflowApprovalSteps,
    getWorkflowStepDetails,
    getWorkflowEntityDetails,
    approveStep,
    rejectStep,
    sendBackStep,
    delegateApproval,
    resubmitWorkflow,
    getApprovalHistory
} from "../../../api/workflowsApi";
import { getUserSignature, uploadUserSignature } from "../../../api/signaturesApi";
import apiClient from "../../../api/apiClient";
import { getRelationships } from "../../../api/edmsApi";
import { getCurrentOrgId, getEsignOtpSetting } from "../../../api/esignOtpApi";
import { displayDate as formatDate, displayDateTime as formatDateTime } from "../../../utils/dateFormat";
import { isDocumentEntityType } from "../../../utils/entityType";
import SignaturePad from "../../identity_n_authentication/user_management/users/SignaturePad";
import PinPlacementLayer from "../../ed_mgt/components/PinPlacementLayer";
import CommentComposer, { isCommentComposerValid } from "../../ed_mgt/components/CommentComposer";
import DocumentDetail, { EsignOtpBox } from "./DocumentSignPanel";

const STEP_STATUS = {
    PENDING: { color: "warning", icon: "ti-clock", label: "Pending" },
    APPROVED: { color: "success", icon: "ti-circle-check", label: "Approved" },
    REJECTED: { color: "danger", icon: "ti-circle-x", label: "Rejected" },
    SKIPPED: { color: "secondary", icon: "ti-player-skip-forward", label: "Skipped" },
    IN_PROGRESS: { color: "primary", icon: "ti-loader", label: "In Progress" },
    SENT_BACK: { color: "orange", icon: "ti-corner-up-left", label: "Sent Back" }
};

const WORKFLOW_STATUS = {
    PENDING: { color: "secondary", label: "Pending" },
    IN_PROGRESS: { color: "primary", label: "In Progress" },
    APPROVED: { color: "success", label: "Approved" },
    REJECTED: { color: "danger", label: "Rejected" },
    CANCELLED: { color: "warning", label: "Cancelled" },
    SENT_BACK: { color: "orange", label: "Sent Back" }
};

const ENTITY_SOURCE_STATUS = {
    live: { color: "success", label: "Live data", icon: "ti-cloud-check" },
    snapshot: { color: "warning", label: "As submitted", icon: "ti-database" },
    none: { color: "danger", label: "Details unavailable", icon: "ti-alert-circle" }
};

const APPROVER_MAX_VISIBLE_ITEMS = 20; // 2 columns × 10 rows

const currentUser = () => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
};

function formatCurrency(amount, currency = "KES") {
    if (amount == null) return "—";
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    } catch {
        return `${currency} ${Number(amount).toLocaleString()}`;
    }
}

function StatusBadge({ status }) {
    const cfg = STEP_STATUS[status] || { color: "secondary", icon: "ti-question-mark", label: status };
    return (
        <span className={`badge bg-${cfg.color}`}>
            <i className={`ti ${cfg.icon} me-1`}></i>
            {cfg.label}
        </span>
    );
}

// Shared by ApproverCard (a single approver's own comment) and the History
// tab (every action's comment) — a plain-text comment renders as the italic
// blockquote this file already used everywhere, while a sticky-note comment
// renders as a small pinned-note block instead, so the two styles are never
// visually confused with each other.
function CommentDisplay({ comment, commentStyle }) {
    if (!comment) return null;

    if (commentStyle === "STICKY_NOTE") {
        return (
            <div
                className="mt-1 p-2 rounded"
                style={{
                    backgroundColor: "#fff9db",
                    border: "1px solid #ffe066",
                    fontSize: "0.85rem",
                    maxWidth: 320
                }}
            >
                <div className="d-flex align-items-start gap-1">
                    <i className="ti ti-pin text-warning mt-1"></i>
                    <div className="mb-1">{comment}</div>
                </div>
            </div>
        );
    }

    return (
        <p className="mb-0 mt-1 text-muted small fst-italic">
            &ldquo;{comment}&rdquo;
        </p>
    );
}

function ApproverCard({ approver, stepStatus, onApprove, onReject, onSendBack, onDelegate, getUserName }) {
    // Groups/roles assigned as an approver often have no specific person
    // resolved yet — fall back to the role/type so the card never renders
    // as a nameless, unexplained box.
    const displayName = approver.approver_name || getUserName?.(approver.user_id) || approver.approver_type || "Approver";
    const isActionable = approver.can_act === 1 && stepStatus === "PENDING";

    return (
        <div className={`card mb-0${isActionable ? " border-warning" : ""}`}>
            <div className="card-body py-2 px-3">
                <div className="mb-1">
                    <strong className="me-2">{displayName}</strong>
                    {approver.approver_name && approver.approver_type && (
                        <span className="badge bg-info me-1">{approver.approver_type}</span>
                    )}
                    <StatusBadge status={approver.status} />
                </div>

                {/* Plain-language explanation of what this card means, so it's
                    never just a badge with no context about what's expected. */}
                {isActionable ? (
                    <div className="small text-warning fw-semibold mb-2">
                        <i className="ti ti-hand-click me-1"></i>
                        This is you — your decision is needed below
                    </div>
                ) : approver.status === "PENDING" ? (
                    <div className="small text-muted mb-2">
                        <i className="ti ti-hourglass-empty me-1"></i>
                        Waiting for this approver to respond
                    </div>
                ) : null}

                {approver.acted_at && (
                    <div className="text-muted small mb-1">
                        <i className="ti ti-clock me-1"></i>
                        {formatDateTime(approver.acted_at)}
                    </div>
                )}
                <CommentDisplay
                    comment={approver.comment}
                    commentStyle={approver.comment_style}
                    pinX={approver.pin_x}
                    pinY={approver.pin_y}
                />
                {approver.signature_id && (
                    <div className="text-muted small mt-1">
                        <i className="ti ti-signature me-1"></i>
                        Signed{approver.signed_at ? ` ${formatDateTime(approver.signed_at)}` : ""}
                    </div>
                )}

                {isActionable && (
                    <div className="btn-group btn-group-sm w-100 mt-2">
                        <button
                            className="btn btn-success"
                            onClick={() => onApprove(approver)}
                        >
                            <i className="ti ti-check me-1"></i>Approve
                        </button>
                        <button
                            className="btn btn-outline-warning"
                            onClick={() => onSendBack(approver)}
                        >
                            <i className="ti ti-corner-up-left me-1"></i>Send Back
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => onReject(approver)}
                        >
                            <i className="ti ti-x me-1"></i>Reject
                        </button>
                    </div>
                )}
                {isActionable && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm w-100 mt-1"
                        onClick={() => onDelegate(approver)}
                    >
                        <i className="ti ti-user-share me-1"></i>Delegate
                    </button>
                )}
            </div>
        </div>
    );
}

// Action-type styling for the History tab timeline — mirrors the color
// conventions STEP_STATUS/WORKFLOW_STATUS already use above (success/
// danger/warning/etc. Bootstrap badge colors) rather than inventing a new
// palette just for this tab.
const HISTORY_ACTION_CFG = {
    SUBMIT:    { color: "info",      icon: "ti-send",           label: "Submitted" },
    APPROVE:   { color: "success",   icon: "ti-circle-check",   label: "Approved" },
    REJECT:    { color: "danger",    icon: "ti-circle-x",       label: "Rejected" },
    SEND_BACK: { color: "warning",   icon: "ti-corner-up-left", label: "Sent Back" },
    RESUBMIT:  { color: "primary",   icon: "ti-refresh",        label: "Resubmitted" },
    CANCEL:    { color: "secondary", icon: "ti-ban",            label: "Cancelled" },
    DELEGATE:  { color: "dark",      icon: "ti-user-share",     label: "Delegated" }
};

function HistoryActionBadge({ action }) {
    const cfg = HISTORY_ACTION_CFG[action] || { color: "secondary", icon: "ti-question-mark", label: action || "—" };
    return (
        <span className={`badge bg-${cfg.color}`}>
            <i className={`ti ${cfg.icon} me-1`}></i>{cfg.label}
        </span>
    );
}

// Full workflow-history timeline — every SUBMIT/APPROVE/REJECT/SEND_BACK/
// RESUBMIT/CANCEL/DELEGATE action recorded against this workflow instance,
// each with its own comment (rendered via the same CommentDisplay the
// ApproverCard's own comment uses, so a sticky note reads the same way in
// both places).
function HistoryTab({ loading, error, rows, onViewPin, getUserName }) {
    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary" role="status" />
                    <span className="ms-2 text-muted">Loading approval history...</span>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="alert alert-warning mb-0">
                <i className="ti ti-alert-triangle me-2"></i>{error}
            </div>
        );
    }
    if (!rows || rows.length === 0) {
        return (
            <div className="card">
                <div className="card-body text-center py-5 text-muted">
                    <i className="ti ti-history" style={{ fontSize: 32 }}></i>
                    <p className="mb-0 mt-2 small">No approval history yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header py-2">
                <h6 className="mb-0"><i className="ti ti-history me-2"></i>Approval History</h6>
            </div>
            <div className="card-body py-3">
                <div style={{ borderLeft: "2px solid #dee2e6", paddingLeft: 24 }}>
                    {rows.map((row, i) => (
                        <div key={row.id ?? `${row.action}-${row.action_at}-${i}`} className="mb-3 position-relative">
                            <div
                                className="position-absolute"
                                style={{
                                    left: -32, top: 6, width: 12, height: 12, borderRadius: "50%",
                                    background: "#007bff", border: "2px solid #fff", boxShadow: "0 0 0 2px #007bff"
                                }}
                            ></div>
                            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <HistoryActionBadge action={row.action} />
                                    <span className="text-muted small">
                                        {getUserName?.(row.user_id) || (row.user_id != null ? `User #${row.user_id}` : "Unknown user")}
                                    </span>
                                    {row.step_order != null && (
                                        <span className="badge bg-light text-dark border">Step {row.step_order}</span>
                                    )}
                                    {row.target_step_order != null && (
                                        <span className="text-muted small">
                                            <i className="ti ti-arrow-forward-up me-1"></i>
                                            To step {row.target_step_order}
                                        </span>
                                    )}
                                    {row.target_user_id != null && (
                                        <span className="text-muted small">
                                            <i className="ti ti-arrow-right me-1"></i>
                                            To {getUserName?.(row.target_user_id) || `User #${row.target_user_id}`}
                                        </span>
                                    )}
                                </div>
                                <small className="text-muted">{formatDateTime(row.action_at)}</small>
                            </div>
                            <CommentDisplay comment={row.comment} commentStyle={row.comment_style} pinX={row.pin_x} pinY={row.pin_y} />
                            {row.comment_style === "STICKY_NOTE" && row.pin_x != null && row.pin_y != null && (
                                <button type="button" className="btn btn-sm btn-link px-0 mt-1" onClick={() => onViewPin?.(row)}>
                                    <i className="ti ti-map-pin me-1"></i>View placement
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BasicSalaryChangeDetail({ details }) {
    let changeData = {};
    let currentData = {};
    try { changeData = JSON.parse(details.change_data || "{}"); } catch {}
    try { currentData = JSON.parse(details.current_data || "{}"); } catch {}

    const currency = changeData.currency_code || currentData.currency_code || "KES";
    const salaryDiff =
        changeData.basic_salary != null && currentData.basic_salary != null
            ? changeData.basic_salary - Number(currentData.basic_salary)
            : null;

    return (
        <div>
            {/* Employee */}
            <div className="d-flex align-items-center gap-3 p-3 rounded mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{ width: 44, height: 44 }}
                >
                    <i className="ti ti-user" style={{ fontSize: 20 }}></i>
                </div>
                <div>
                    <h6 className="mb-0">{details.staff_name || "—"}</h6>
                    <span className="badge bg-secondary">{details.employee_number || `Staff #${details.staff_id}`}</span>
                </div>
            </div>

            {/* Current vs Proposed salary */}
            <div className="row g-2 mb-3 align-items-stretch">
                <div className="col-md-5">
                    <div className="card border-secondary h-100 mb-0">
                        <div className="card-header py-2 bg-secondary text-white">
                            <small className="fw-semibold"><i className="ti ti-database me-1"></i>Current Salary</small>
                        </div>
                        <div className="card-body py-2 px-3">
                            <div className="h5 mb-1 fw-bold text-secondary">
                                {formatCurrency(currentData.basic_salary, currentData.currency_code || currency)}
                            </div>
                            <div className="small text-muted d-flex flex-column gap-1">
                                <span><i className="ti ti-refresh me-1"></i>{currentData.pay_frequency || "—"}</span>
                                <span><i className="ti ti-calendar me-1"></i>Since {formatDate(currentData.effective_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 d-flex align-items-center justify-content-center flex-column gap-1">
                    <i className="ti ti-arrow-right text-muted" style={{ fontSize: 22 }}></i>
                    {salaryDiff !== null && (
                        <span className={`badge ${salaryDiff > 0 ? "bg-success" : salaryDiff < 0 ? "bg-danger" : "bg-secondary"}`}>
                            {salaryDiff > 0 ? "+" : ""}{formatCurrency(salaryDiff, currency)}
                        </span>
                    )}
                </div>
                <div className="col-md-5">
                    <div className="card border-primary h-100 mb-0">
                        <div className="card-header py-2 bg-primary text-white">
                            <small className="fw-semibold"><i className="ti ti-edit me-1"></i>Proposed Salary</small>
                        </div>
                        <div className="card-body py-2 px-3">
                            <div className="h5 mb-1 fw-bold text-primary">
                                {formatCurrency(changeData.basic_salary, changeData.currency_code || currency)}
                            </div>
                            <div className="small text-muted d-flex flex-column gap-1">
                                <span><i className="ti ti-refresh me-1"></i>{changeData.pay_frequency || "—"}</span>
                                <span><i className="ti ti-calendar me-1"></i>Effective {formatDate(changeData.effective_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request metadata */}
            <div className="row g-2">
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Status</td>
                                <td>
                                    <span className={`badge bg-${details.status === "Pending" ? "warning text-dark" : details.status === "Approved" ? "success" : "danger"}`}>
                                        {details.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="text-muted">Requested By</td>
                                <td>{details.requested_by_name?.trim() || `User #${details.requested_by}`}</td>
                            </tr>
                            <tr>
                                <td className="text-muted">Requested At</td>
                                <td>{formatDateTime(details.requested_at)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Effective Date</td>
                                <td>{formatDate(details.effective_date)}</td>
                            </tr>
                            {details.reason && (
                                <tr>
                                    <td className="text-muted">Reason</td>
                                    <td className="fst-italic">{details.reason}</td>
                                </tr>
                            )}
                            {details.reviewed_by_name?.trim() && (
                                <tr>
                                    <td className="text-muted">Reviewed By</td>
                                    <td>{details.reviewed_by_name}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LeaveRequestDetail({ details }) {
    const daysUsed = Number(details.requested_working_days) || 0;
    const daysAllowed = Number(details.days_allowed) || 0;
    const pct = daysAllowed > 0 ? Math.min(100, Math.round((daysUsed / daysAllowed) * 100)) : 0;

    return (
        <div>
            {/* Employee & Acting Staff */}
            <div className="row g-3 mb-3">
                <div className="col-md-6">
                    <div className="p-3 rounded h-100" style={{ backgroundColor: "#f8f9fa" }}>
                        <div className="text-muted small fw-semibold mb-2">
                            <i className="ti ti-user me-1"></i>Employee
                        </div>
                        <h6 className="mb-1">{details.staff_name}</h6>
                        <div className="small text-muted">{details.staff_employee_number}</div>
                        <div className="small text-muted">{details.staff_email}</div>
                    </div>
                </div>
                {details.acting_staff_name && (
                    <div className="col-md-6">
                        <div className="p-3 rounded h-100" style={{ backgroundColor: "#eaf6fb", border: "1px solid #b6e0f1" }}>
                            <div className="text-muted small fw-semibold mb-2">
                                <i className="ti ti-user-check me-1"></i>Acting Staff
                            </div>
                            <h6 className="mb-1">{details.acting_staff_name}</h6>
                            <div className="small text-muted">{details.acting_staff_employee_number}</div>
                            <div className="small text-muted">{details.acting_staff_email}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Leave type & dates */}
            <div className="row g-2 mb-3">
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Leave Type</td>
                                <td>
                                    <span className="badge bg-info me-1">{details.leave_type}</span>
                                    {details.is_paid && <span className="badge bg-success">Paid</span>}
                                </td>
                            </tr>
                            <tr>
                                <td className="text-muted">Duration Type</td>
                                <td>{details.leave_duration_type || "—"}</td>
                            </tr>
                            <tr>
                                <td className="text-muted">Status</td>
                                <td>
                                    <span className={`badge bg-${details.status === "Pending" ? "warning text-dark" : details.status === "Approved" ? "success" : "danger"}`}>
                                        {details.status}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Start Date</td>
                                <td>{formatDate(details.start_date)}</td>
                            </tr>
                            <tr>
                                <td className="text-muted">End Date</td>
                                <td>{formatDate(details.end_date)}</td>
                            </tr>
                            <tr>
                                <td className="text-muted">Return Date</td>
                                <td>{formatDate(details.calculated_return_date)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hour-based leave details */}
            {details.leave_duration_type === "Hours" && (
                <div className="row g-2 mb-3">
                    <div className="col-md-6">
                        <div className="p-3 rounded" style={{ backgroundColor: "#f8f9fa", border: "1px solid #e0e0e0" }}>
                            <div className="text-muted small fw-semibold mb-2">
                                <i className="ti ti-clock me-1"></i>Start Time
                            </div>
                            <div className="h6 mb-0">{details.start_time || "—"}</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-3 rounded" style={{ backgroundColor: "#f8f9fa", border: "1px solid #e0e0e0" }}>
                            <div className="text-muted small fw-semibold mb-2">
                                <i className="ti ti-hourglass me-1"></i>Duration
                            </div>
                            <div className="h6 mb-0">{details.duration_hours ? `${details.duration_hours} hours` : "—"}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Days progress - only for non-hourly leaves */}
            {details.leave_duration_type !== "Hours" && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Days requested</small>
                        <small className="fw-semibold">
                            {daysUsed} working day{daysUsed !== 1 ? "s" : ""} of {daysAllowed} allowed
                        </small>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                        <div
                            className={`progress-bar ${pct > 80 ? "bg-warning" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Notes */}
            {details.notes && (
                <div className="p-3 rounded border" style={{ backgroundColor: "#f8f9fa" }}>
                    <small className="text-muted fw-semibold">
                        <i className="ti ti-note me-1"></i>Notes
                    </small>
                    <p className="mb-0 mt-1 fst-italic small">&ldquo;{details.notes}&rdquo;</p>
                </div>
            )}
        </div>
    );
}

function PayrollRunDetail({ details }) {
    const currency = details.currency_code || "KES";
    const statusColor =
        details.status === "Pending Approval" ? "warning text-dark" :
        details.status === "Approved" ? "success" :
        details.status === "Posted" ? "primary" :
        details.status === "Rejected" ? "danger" : "secondary";

    const summaryRows = [
        { label: "Gross Pay", value: details.total_gross_pay, color: "text-body" },
        { label: "Deductions", value: details.total_deductions, color: "text-danger" },
        { label: "Statutory", value: details.total_statutory, color: "text-warning" },
        { label: "Net Pay", value: details.total_net_pay, color: "text-success fw-bold" },
        { label: "Employer Cost", value: details.total_employer_cost, color: "text-primary" },
    ];

    return (
        <div>
            {/* Run header */}
            <div className="d-flex align-items-center gap-3 p-3 rounded mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{ width: 44, height: 44 }}
                >
                    <i className="ti ti-report-money" style={{ fontSize: 20 }}></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                    <h6 className="mb-0 text-break">{details.run_number}</h6>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                        <span className="badge bg-info">{details.run_type}</span>
                        <span className="badge bg-secondary">{details.pay_period_type}</span>
                        <span className={`badge bg-${statusColor}`}>{details.status}</span>
                        {details.is_locked && (
                            <span className="badge bg-dark"><i className="ti ti-lock me-1"></i>Locked</span>
                        )}
                    </div>
                </div>
                <div className="text-end flex-shrink-0">
                    <div className="small text-muted">Employees</div>
                    <div className="h5 mb-0 fw-bold">{details.total_employees}</div>
                </div>
            </div>

            {/* Period dates */}
            <div className="row g-2 mb-3">
                {[
                    { icon: "ti-calendar", label: "Run Date", value: formatDate(details.run_date) },
                    { icon: "ti-calendar-event", label: "Period Start", value: formatDate(details.period_start) },
                    { icon: "ti-calendar-event", label: "Period End", value: formatDate(details.period_end) },
                    { icon: "ti-cash", label: "Payment Date", value: formatDate(details.payment_date) },
                ].map(({ icon, label, value }) => (
                    <div key={label} className="col-6 col-md-3">
                        <div className="p-2 rounded border text-center h-100" style={{ backgroundColor: "#f8f9fa" }}>
                            <div className="text-muted small mb-1">
                                <i className={`ti ${icon} me-1`}></i>{label}
                            </div>
                            <div className="fw-semibold small">{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Financial summary */}
            <div className="card border mb-3">
                <div className="card-header py-2">
                    <small className="fw-semibold text-muted">
                        <i className="ti ti-chart-bar me-1"></i>Financial Summary
                    </small>
                </div>
                <div className="card-body py-2 px-3">
                    <div className="row g-0">
                        {summaryRows.map(({ label, value, color }, idx) => (
                            <div key={label} className={`col-12 col-sm-6 col-md py-2 px-3${idx > 0 ? " border-start-sm" : ""}`}
                                style={{ borderLeft: idx > 0 ? undefined : undefined }}>
                                <div className="text-muted small mb-1">{label}</div>
                                <div className={`fw-semibold ${color}`}>
                                    {formatCurrency(value, currency)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="row g-2">
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Created At</td>
                                <td>{formatDateTime(details.created_at)}</td>
                            </tr>
                            {details.processed_at && (
                                <tr>
                                    <td className="text-muted">Processed At</td>
                                    <td>{formatDateTime(details.processed_at)}</td>
                                </tr>
                            )}
                            {details.approved_at && (
                                <tr>
                                    <td className="text-muted">Approved At</td>
                                    <td>{formatDateTime(details.approved_at)}</td>
                                </tr>
                            )}
                            {details.posted_at && (
                                <tr>
                                    <td className="text-muted">Posted At</td>
                                    <td>{formatDateTime(details.posted_at)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            {details.workflow_status && (
                                <tr>
                                    <td className="text-muted" style={{ width: "45%" }}>Workflow Status</td>
                                    <td>
                                        <span className={`badge bg-${WORKFLOW_STATUS[details.workflow_status]?.color || "secondary"}`}>
                                            {WORKFLOW_STATUS[details.workflow_status]?.label || details.workflow_status}
                                        </span>
                                    </td>
                                </tr>
                            )}
                            {details.notes && (
                                <tr>
                                    <td className="text-muted">Notes</td>
                                    <td className="fst-italic">{details.notes}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AllowanceChangeDetail({ details }) {
    let changeData = {};
    let currentData = {};
    try { changeData = JSON.parse(details.change_data || "{}"); } catch {}
    try { currentData = JSON.parse(details.current_data || "{}"); } catch {}

    const currency = "KES";
    const allowanceName =
        currentData.allowance_name ||
        details.reason?.replace(/^Update allowance:\s*/i, "") ||
        `Allowance #${changeData.allowance_type_id || currentData.allowance_type_id || ""}`;
    const amountDiff =
        changeData.amount != null && currentData.amount != null
            ? changeData.amount - Number(currentData.amount)
            : null;

    return (
        <div>
            {/* Employee */}
            <div className="d-flex align-items-center gap-3 p-3 rounded mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                    style={{ width: 44, height: 44 }}
                >
                    <i className="ti ti-user" style={{ fontSize: 20 }}></i>
                </div>
                <div>
                    <h6 className="mb-0">{details.staff_name || "—"}</h6>
                    <span className="badge bg-secondary">{details.employee_number || `Staff #${details.staff_id}`}</span>
                </div>
                <div className="ms-auto text-end">
                    <div className="small text-muted fw-semibold">{allowanceName}</div>
                    {details.action_type && (
                        <span className="badge bg-info">{details.action_type}</span>
                    )}
                </div>
            </div>

            {/* Current vs Proposed amount */}
            <div className="row g-2 mb-3 align-items-stretch">
                <div className="col-md-5">
                    <div className="card border-secondary h-100 mb-0">
                        <div className="card-header py-2 bg-secondary text-white">
                            <small className="fw-semibold"><i className="ti ti-database me-1"></i>Current Amount</small>
                        </div>
                        <div className="card-body py-2 px-3">
                            <div className="h5 mb-1 fw-bold text-secondary">
                                {formatCurrency(currentData.amount, currency)}
                            </div>
                            <div className="small text-muted d-flex flex-column gap-1">
                                <span>
                                    <i className="ti ti-refresh me-1"></i>
                                    {currentData.is_recurring ? "Recurring" : "One-time"}
                                </span>
                                <span>
                                    <i className="ti ti-calendar me-1"></i>
                                    Since {formatDate(currentData.effective_date)}
                                </span>
                                {currentData.end_date && (
                                    <span>
                                        <i className="ti ti-calendar-off me-1"></i>
                                        Ends {formatDate(currentData.end_date)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 d-flex align-items-center justify-content-center flex-column gap-1">
                    <i className="ti ti-arrow-right text-muted" style={{ fontSize: 22 }}></i>
                    {amountDiff !== null && (
                        <span className={`badge ${amountDiff > 0 ? "bg-success" : amountDiff < 0 ? "bg-danger" : "bg-secondary"}`}>
                            {amountDiff > 0 ? "+" : ""}{formatCurrency(amountDiff, currency)}
                        </span>
                    )}
                </div>
                <div className="col-md-5">
                    <div className="card border-primary h-100 mb-0">
                        <div className="card-header py-2 bg-primary text-white">
                            <small className="fw-semibold"><i className="ti ti-edit me-1"></i>Proposed Amount</small>
                        </div>
                        <div className="card-body py-2 px-3">
                            <div className="h5 mb-1 fw-bold text-primary">
                                {formatCurrency(changeData.amount, currency)}
                            </div>
                            <div className="small text-muted d-flex flex-column gap-1">
                                <span>
                                    <i className="ti ti-refresh me-1"></i>
                                    {changeData.is_recurring ? "Recurring" : "One-time"}
                                </span>
                                <span>
                                    <i className="ti ti-calendar me-1"></i>
                                    Effective {formatDate(changeData.effective_date)}
                                </span>
                                {changeData.end_date && (
                                    <span>
                                        <i className="ti ti-calendar-off me-1"></i>
                                        Ends {formatDate(changeData.end_date)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request metadata */}
            <div className="row g-2">
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Status</td>
                                <td>
                                    <span className={`badge bg-${details.status === "Pending" ? "warning text-dark" : details.status === "Approved" ? "success" : "danger"}`}>
                                        {details.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="text-muted">Requested By</td>
                                <td>{details.requested_by_name?.trim() || `User #${details.requested_by}`}</td>
                            </tr>
                            <tr>
                                <td className="text-muted">Requested At</td>
                                <td>{formatDateTime(details.requested_at)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col-md-6">
                    <table className="table table-sm table-borderless mb-0">
                        <tbody>
                            <tr>
                                <td className="text-muted" style={{ width: "45%" }}>Effective Date</td>
                                <td>{formatDate(details.effective_date)}</td>
                            </tr>
                            {details.reason && (
                                <tr>
                                    <td className="text-muted">Reason</td>
                                    <td className="fst-italic">{details.reason}</td>
                                </tr>
                            )}
                            {details.reviewed_by_name?.trim() && (
                                <tr>
                                    <td className="text-muted">Reviewed By</td>
                                    <td>{details.reviewed_by_name}</td>
                                </tr>
                            )}
                            {details.review_notes && (
                                <tr>
                                    <td className="text-muted">Review Notes</td>
                                    <td className="fst-italic">{details.review_notes}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}



// Supporting documents attached to a plain document approval (via the
// Submit for Approval page, at submit time) — Core.DocumentRelationships
// rows of type SUPPORTS.
function DocumentSupportingDocs({ documentId }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (!documentId) return;
        let cancelled = false;
        getRelationships(documentId)
            .then((res) => {
                if (cancelled) return;
                const rows = res?.data || (Array.isArray(res) ? res : []);
                const supports = rows
                    .filter((r) => r.relationship_type === "SUPPORTS")
                    .map((r) => {
                        const isSource = r.source_document_id === documentId;
                        return {
                            id: r.id,
                            title: isSource ? r.target_document_title : r.source_document_title,
                            reference: isSource ? r.target_document_reference : r.source_document_reference,
                            documentId: isSource ? r.target_document_id : r.source_document_id,
                        };
                    });
                setItems(supports);
            })
            .catch(() => { if (!cancelled) setLoadError("Could not load supporting documents."); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [documentId]);

    return (
        <div className="mb-3">
            <h6 className="f-12 mb-2">Supporting Documents</h6>
            {loading ? (
                <div className="text-center py-2"><span className="spinner-border spinner-border-sm" /></div>
            ) : loadError ? (
                <div className="alert alert-warning py-2">{loadError}</div>
            ) : items.length === 0 ? (
                <p className="text-muted f-12">No supporting documents were attached.</p>
            ) : (
                <ul className="list-group">
                    {items.map((item) => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <div className="f-12 fw-semibold">{item.title || `Document #${item.documentId}`}</div>
                                <div className="f-10 text-muted">{item.reference}</div>
                            </div>
                            <a
                                className="btn btn-sm btn-outline-secondary"
                                href={`/ed-mgt/documents/${item.documentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="ti ti-external-link" />
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function ApprovalWindow() {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = currentUser();
    const currentUserId = user?.id ?? user?.user_id;

    const [loading, setLoading] = useState(true);
    const [instance, setInstance] = useState(null);
    const [steps, setSteps] = useState([]);
    const [error, setError] = useState("");

    // Wizard navigation
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentStepDetail, setCurrentStepDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Entity details
    const [entityDetail, setEntityDetail] = useState(null);
    const [loadingEntityDetail, setLoadingEntityDetail] = useState(false);
    const [entityDetailError, setEntityDetailError] = useState("");

    // Action modal
    const [actionModal, setActionModal] = useState({
        open: false,
        action: null, // "APPROVE" | "REJECT" | "SEND_BACK"
        stepApproverId: null,
        targetStepOrder: ""
    });
    const [commentState, setCommentState] = useState({ comment: "", commentStyle: "TEXT", pinX: null, pinY: null });
    const [delegateUserId, setDelegateUserId] = useState("");
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState("");
    const [showApproversDrawer, setShowApproversDrawer] = useState(false);
    const [showAllEntityFields, setShowAllEntityFields] = useState(false);

    // Sticky-note pin placement — lifted up here (rather than kept local to
    // CommentComposer) because the actual document preview to click on lives
    // in the DocumentDetail preview column, outside the portal-rendered
    // action panel CommentComposer renders inside of.
    const [placingPin, setPlacingPin] = useState(false);

    // Main page tab — "workflow" is the existing wizard/preview content,
    // unchanged; "history" is the new full approval-history timeline.
    const [mainTab, setMainTab] = useState("workflow");
    const [history, setHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [historyPinPreview, setHistoryPinPreview] = useState(null);

    // Workflow user_ids (submitter, approvers, history actors) have no name
    // attached server-side — WorkflowsAPI only knows ids, same gap
    // CreateWorkflowDefinition.jsx already works around by loading the org's
    // user list from IAmAPI once and resolving names client-side.
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const token = localStorage.getItem("token");
        apiClient.get("/IAmAPI/api/users", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setUsers(res.data || []))
            .catch(() => {});
    }, []);
    const getUserName = (userId) => {
        if (userId == null) return null;
        const u = users.find((x) => x.id === userId);
        return u ? `${u.first_name} ${u.other_name}`.trim() : null;
    };

    // Signature on approve
    const [mySignature, setMySignature] = useState(null);
    const [loadingSignature, setLoadingSignature] = useState(false);
    const [signatureChecked, setSignatureChecked] = useState(false);
    const [drawingApprovalSignature, setDrawingApprovalSignature] = useState(false);
    const [savingApprovalSignature, setSavingApprovalSignature] = useState(false);
    const [otpRequired, setOtpRequired] = useState(false);
    const [approvalOtpCode, setApprovalOtpCode] = useState("");

    useEffect(() => {
        const orgId = getCurrentOrgId();
        if (!orgId) return;
        getEsignOtpSetting(orgId)
            .then((r) => setOtpRequired(!!(r?.require_otp_for_esign ?? r?.data?.require_otp_for_esign)))
            .catch(() => setOtpRequired(false));
    }, []);

    // Resubmit (send-back companion flow)
    const [resubmitComment, setResubmitComment] = useState("");
    const [resubmitting, setResubmitting] = useState(false);
    const [resubmitError, setResubmitError] = useState("");

    const normalizeActionId = (value) => {
        if (value == null) return null;
        if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length ? trimmed : null;
        }
        return value;
    };

    const getApproverActionId = (approver) =>
        normalizeActionId(
            approver?.step_approver_id ??
                approver?.stepApproverId ??
                approver?.approver_id ??
                approver?.approverId ??
                approver?.id
        );

    const normalizeEntityDetailPayload = (responsePayload) => {
        if (!responsePayload || typeof responsePayload !== "object") return null;

        const nested = responsePayload?.data;
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
            if (
                "entity_details" in nested ||
                "entityDetails" in nested ||
                "data_source" in nested ||
                "dataSource" in nested
            ) {
                return nested;
            }
        }

        if (
            "entity_details" in responsePayload ||
            "entityDetails" in responsePayload ||
            "data_source" in responsePayload ||
            "dataSource" in responsePayload
        ) {
            return responsePayload;
        }

        return null;
    };

    const formatEntityFieldName = (key) => {
        if (!key) return "Field";
        return String(key)
            .replace(/_/g, " ")
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^./, (char) => char.toUpperCase());
    };

    const looksLikeDateTime = (value) => {
        if (typeof value !== "string") return false;
        const trimmed = value.trim();
        if (!trimmed) return false;
        const isoLike =
            /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
            /^\d{4}\/\d{2}\/\d{2}/.test(trimmed);
        return isoLike && !Number.isNaN(Date.parse(trimmed));
    };

    const renderEntityValue = (value, path = "root") => {
        if (value == null) {
            return <span className="text-muted">—</span>;
        }

        if (typeof value === "boolean") {
            return <span>{value ? "Yes" : "No"}</span>;
        }

        if (typeof value === "number" || typeof value === "bigint") {
            return <span>{String(value)}</span>;
        }

        if (typeof value === "string") {
            return <span>{looksLikeDateTime(value) ? formatDateTime(value) : value}</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-muted">Empty list</span>;
            return (
                <div className="d-flex flex-column gap-2">
                    {value.map((item, index) => (
                        <div key={`${path}-${index}`} className="border rounded p-2 bg-light-subtle">
                            {renderEntityValue(item, `${path}-${index}`)}
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof value === "object") {
            const entries = Object.entries(value);
            if (!entries.length) return <span className="text-muted">No fields</span>;

            return (
                <dl className="mb-0" style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "16px", rowGap: "6px" }}>
                    {entries.map(([key, fieldValue]) => (
                        <>
                            <dt key={`${path}-${key}-dt`} className="text-muted fw-semibold" style={{ minWidth: "140px" }}>
                                {formatEntityFieldName(key)}
                            </dt>
                            <dd key={`${path}-${key}-dd`} className="mb-0">
                                {renderEntityValue(fieldValue, `${path}-${key}`)}
                            </dd>
                        </>
                    ))}
                </dl>
            );
        }

        return <span>{String(value)}</span>;
    };

    const renderEntityDetailsByType = (entityType, details, documentPreview) => {
        if (!details) return renderEntityValue(details);
        if (isDocumentEntityType(entityType)) {
            return (
                <DocumentDetail
                    details={details}
                    documentPreview={documentPreview}
                    currentUserId={currentUserId}
                    onSigned={() => loadEntityDetail(id)}
                    placingPin={placingPin}
                    onPlacePin={handlePlacePin}
                    onMovePin={handleMovePin}
                    pendingPin={commentState.pinX != null ? { x: commentState.pinX, y: commentState.pinY, note: commentState.comment } : null}
                />
            );
        }
        switch (entityType) {
            case "BASIC_SALARY_CHANGE_REQUEST":
                return <BasicSalaryChangeDetail details={details} />;
            case "ALLOWANCE_CHANGE_REQUEST":
                return <AllowanceChangeDetail details={details} />;
            case "PAYROLL_RUN":
                return <PayrollRunDetail details={details} />;
            case "LEAVE_REQUEST":
                return <LeaveRequestDetail details={details} />;
            default:
                return renderEntityValue(details);
        }
    };

    const getEntitySourceStatus = (source) => {
        if (!source) return ENTITY_SOURCE_STATUS.none;
        return ENTITY_SOURCE_STATUS[String(source).toLowerCase()] || {
            color: "secondary",
            label: source,
            icon: "ti-info-circle"
        };
    };

    useEffect(() => {
        if (id) loadWorkflow();
    }, [id]);

    const loadWorkflow = async () => {
        try {
            setLoading(true);
            setError("");
            setEntityDetailError("");
            const res = await getWorkflowApprovalSteps(id);
            if (res.success) {
                const loadedSteps = res.data.steps || [];
                setInstance(res.data.instance);
                setSteps(loadedSteps);
                const firstPendingIdx = loadedSteps.findIndex(
                    (s) => s.status === "PENDING" || s.status === "SENT_BACK"
                );
                setCurrentStepIndex(firstPendingIdx >= 0 ? firstPendingIdx : 0);
                setCurrentStepDetail(null);
                loadEntityDetail(id);
            } else {
                setError(res.message || "Failed to load workflow");
            }
        } catch (err) {
            console.error("Error loading workflow:", err);
            setError("Failed to load workflow details");
        } finally {
            setLoading(false);
        }
    };

    const loadEntityDetail = async (workflowInstanceId) => {
        try {
            setLoadingEntityDetail(true);
            setEntityDetailError("");
            const res = await getWorkflowEntityDetails(workflowInstanceId);
            const normalized = normalizeEntityDetailPayload(res);
            setEntityDetail(normalized);
            if (!normalized) {
                setEntityDetailError("Entity detail payload was not returned in a supported format.");
            }
        } catch (err) {
            console.error("Error loading entity details:", err);
            setEntityDetail(null);
            setEntityDetailError(
                err?.response?.data?.message || "Failed to load entity details for approval review."
            );
        } finally {
            setLoadingEntityDetail(false);
        }
    };

    useEffect(() => {
        if (!steps.length || loading) return;
        const step = steps[currentStepIndex];
        if (!step) return;
        loadStepDetail(step.step_order);
    }, [currentStepIndex, steps, loading]);

    // Loaded once, the first time the History tab is opened — not on every
    // tab switch back to it.
    const loadHistory = async () => {
        if (!id || loadingHistory || history !== null) return;
        setLoadingHistory(true);
        setHistoryError("");
        try {
            const res = await getApprovalHistory(id);
            setHistory(res?.data || (Array.isArray(res) ? res : []));
        } catch (err) {
            console.error("Error loading approval history:", err);
            setHistoryError(err?.response?.data?.message || "Failed to load approval history.");
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadStepDetail = async (stepOrder) => {
        try {
            setLoadingDetail(true);
            setCurrentStepDetail(null);
            setShowApproversDrawer(false);
            const res = await getWorkflowStepDetails(id, stepOrder);
            if (res.success) {
                setCurrentStepDetail(res.data);
            }
        } catch (err) {
            console.error("Error loading step details:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const goToStep = (index) => {
        if (!canGoToStep(index)) return;
        setCurrentStepIndex(index);
    };

    const openActionModal = async (action, stepApproverId) => {
        setActionModal({ open: true, action, stepApproverId, targetStepOrder: "" });
        setCommentState({ comment: "", commentStyle: "TEXT", pinX: null, pinY: null });
        setDelegateUserId("");
        setPlacingPin(false);
        setSignatureChecked(false);
        setDrawingApprovalSignature(false);
        setApprovalOtpCode("");
        setActionError(
            stepApproverId == null
                ? "Unable to identify this approver action. Refresh and try again."
                : ""
        );

        if (action === "APPROVE" && currentUserId != null) {
            setLoadingSignature(true);
            try {
                const sig = await getUserSignature(currentUserId);
                setMySignature(sig);
            } catch {
                setMySignature(null);
            } finally {
                setLoadingSignature(false);
            }
        }
    };

    const closeActionModal = () => {
        if (processing) return;
        setActionModal({ open: false, action: null, stepApproverId: null, targetStepOrder: "" });
        setCommentState({ comment: "", commentStyle: "TEXT", pinX: null, pinY: null });
        setDelegateUserId("");
        setPlacingPin(false);
        setActionError("");
        setSignatureChecked(false);
        setDrawingApprovalSignature(false);
        setApprovalOtpCode("");
    };

    // Called from the DocumentDetail preview's PinPlacementLayer once the
    // user clicks a spot on the document — lands the pin into the
    // in-progress comment and brings the (still-open, just-hidden) action
    // modal back.
    const handlePlacePin = (x, y) => {
        setCommentState((prev) => ({ ...prev, commentStyle: "STICKY_NOTE", pinX: x, pinY: y }));
        setPlacingPin(false);
    };

    const handleMovePin = (x, y) => {
        setCommentState((prev) => ({ ...prev, pinX: x, pinY: y }));
    };

    const handleDrawnApprovalSignature = async (file) => {
        if (currentUserId == null) return;
        setSavingApprovalSignature(true);
        setActionError("");
        try {
            const sig = await uploadUserSignature(currentUserId, file);
            setMySignature(sig);
            setSignatureChecked(true);
            setDrawingApprovalSignature(false);
        } catch (err) {
            setActionError(err?.response?.data?.message || "Failed to save signature.");
        } finally {
            setSavingApprovalSignature(false);
        }
    };

    const handleAction = async () => {
        if (actionModal.stepApproverId == null) {
            setActionError("Missing approver action id. Please refresh and try again.");
            return;
        }
        const commentRequired = actionModal.action === "REJECT" || actionModal.action === "SEND_BACK";
        if (!isCommentComposerValid(commentState, commentRequired)) {
            if (commentState.commentStyle === "STICKY_NOTE" && (commentState.pinX == null || commentState.pinY == null)) {
                setActionError("Place your sticky note on the document before confirming.");
            } else {
                setActionError(
                    actionModal.action === "SEND_BACK"
                        ? "A comment is required to send this back."
                        : "Rejection comment is required."
                );
            }
            return;
        }
        if (actionModal.action === "SEND_BACK" && actionModal.targetStepOrder === "") {
            setActionError("Please choose where to send this back to.");
            return;
        }
        if (actionModal.action === "DELEGATE" && !delegateUserId) {
            setActionError("Please choose who to delegate this to.");
            return;
        }
        if (actionModal.action === "APPROVE" && signatureChecked && otpRequired && !approvalOtpCode.trim()) {
            setActionError("Enter the verification code emailed to you first.");
            return;
        }

        try {
            setProcessing(true);
            setActionError("");
            let res;
            const commentPayload = {
                comment: commentState.comment,
                commentStyle: commentState.commentStyle,
                pinX: commentState.pinX,
                pinY: commentState.pinY
            };
            if (actionModal.action === "APPROVE") {
                res = await approveStep(actionModal.stepApproverId, {
                    ...commentPayload,
                    signatureId: signatureChecked ? mySignature?.id : undefined,
                    otpCode: signatureChecked && otpRequired ? approvalOtpCode.trim() : undefined
                });
            } else if (actionModal.action === "REJECT") {
                res = await rejectStep(actionModal.stepApproverId, commentPayload);
            } else if (actionModal.action === "SEND_BACK") {
                res = await sendBackStep(actionModal.stepApproverId, {
                    ...commentPayload,
                    targetStepOrder: Number(actionModal.targetStepOrder)
                });
            } else {
                res = await delegateApproval(actionModal.stepApproverId, {
                    ...commentPayload,
                    delegatedToUserId: Number(delegateUserId)
                });
            }

            if (res.success) {
                closeActionModal();
                await loadWorkflow();
            } else {
                setActionError(res.message || "Action failed. Please try again.");
            }
        } catch (err) {
            console.error("Approval action error:", err);
            const msg = err?.response?.data?.message;
            if (actionModal.action === "APPROVE" && signatureChecked && err?.response?.status === 400) {
                // Likely raced with the signature being removed/deactivated elsewhere — refresh its state.
                setSignatureChecked(false);
                try {
                    const sig = await getUserSignature(currentUserId);
                    setMySignature(sig);
                } catch {
                    setMySignature(null);
                }
            }
            setActionError(msg || "Action failed. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleResubmit = async () => {
        try {
            setResubmitting(true);
            setResubmitError("");
            const res = await resubmitWorkflow(id, resubmitComment.trim() || undefined);
            if (res.success) {
                setResubmitComment("");
                await loadWorkflow();
            } else {
                setResubmitError(res.message || "Failed to resubmit workflow.");
            }
        } catch (err) {
            console.error("Resubmit error:", err);
            setResubmitError(err?.response?.data?.message || "Failed to resubmit workflow.");
        } finally {
            setResubmitting(false);
        }
    };

    const getApprovedStepsCount = () => steps.filter((s) => s.status === "APPROVED").length;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-3">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 mb-0">Loading workflow details...</p>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !instance) {
        return (
            <DashboardLayout>
                <div className="px-3">
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-danger mb-3">
                            <i className="ti ti-alert-circle me-2"></i>
                            {error}
                        </div>
                        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                            <i className="ti ti-arrow-left me-1"></i>Back
                        </button>
                    </div>
                </div>
                </div>
            </DashboardLayout>
        );
    }

    const wfStatus = WORKFLOW_STATUS[instance?.status] || {
        color: "secondary",
        label: instance?.status
    };

    const currentStep = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    // A step is accessible only if all steps before it are completed (APPROVED / REJECTED / SKIPPED)
    const firstPendingIdx = steps.findIndex(
        (s) => s.status === "PENDING" || s.status === "IN_PROGRESS" || s.status === "SENT_BACK"
    );
    const maxAccessibleIdx = firstPendingIdx >= 0 ? firstPendingIdx : steps.length - 1;
    const canGoToStep = (index) => index >= 0 && index <= maxAccessibleIdx;
    const canApproveCurrentStep =
        currentStep?.user_can_approve === 1 && currentStep?.status === "PENDING";

    // Send Back / Resubmit
    const sentBackStepIdx = steps.findIndex((s) => s.status === "SENT_BACK");
    const sentBackStep = sentBackStepIdx >= 0 ? steps[sentBackStepIdx] : null;
    const isSentBackToSubmitter = instance?.status === "SENT_BACK" && !sentBackStep;
    const canActOnSentBackStep =
        Boolean(sentBackStep) &&
        currentStep?.step_order === sentBackStep.step_order &&
        (currentStepDetail?.approvers || []).some((a) => a.can_act === 1);
    const canResubmit =
        instance?.status === "SENT_BACK" &&
        (isSentBackToSubmitter
            ? currentUserId != null && instance?.started_by === currentUserId
            : canActOnSentBackStep);
    const sendBackTargetOptions = currentStep
        ? [
              { value: 0, label: "Back to submitter" },
              ...steps
                  .filter((s) => s.step_order < currentStep.step_order)
                  .map((s) => ({ value: s.step_order, label: `Step ${s.step_order} — ${s.step_name}` }))
          ]
        : [];

    const entityDetailsValue =
        entityDetail?.entity_details ??
        entityDetail?.entityDetails ??
        entityDetail?.details ??
        null;
    const entitySource = entityDetail?.data_source ?? entityDetail?.dataSource ?? "none";
    const entitySourceCfg = getEntitySourceStatus(entitySource);

    // Document-specific identity (reference, type, status, created/uploaded) —
    // rendered in the Instance Summary card below instead of repeated inside
    // the Entity Details card's DocumentDetail renderer.
    const docDetails = isDocumentEntityType(instance?.entity_type) ? entityDetailsValue : null;
    const docVersion = docDetails?.current_version || {};
    const docStatusColor =
        docDetails?.status === "PENDING_APPROVAL" ? "warning text-dark" :
        docDetails?.status === "APPROVED" ? "success" :
        docDetails?.status === "REJECTED" ? "danger" :
        docDetails?.status === "LANDING" ? "secondary" : "info";
    const approvers = currentStepDetail?.approvers || [];
    const hasMoreApprovers = approvers.length > APPROVER_MAX_VISIBLE_ITEMS;
    const visibleApprovers = hasMoreApprovers
        ? approvers.slice(0, APPROVER_MAX_VISIBLE_ITEMS)
        : approvers;

    const handleApproverApprove = (approver) =>
        openActionModal("APPROVE", getApproverActionId(approver));
    const handleApproverReject = (approver) =>
        openActionModal("REJECT", getApproverActionId(approver));
    const handleApproverSendBack = (approver) =>
        openActionModal("SEND_BACK", getApproverActionId(approver));
    const handleApproverDelegate = (approver) =>
        openActionModal("DELEGATE", getApproverActionId(approver));

    return (
        <DashboardLayout>
            <div className="px-3">
            {/* Page Header */}
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-block">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => navigate(-1)}
                                        >
                                            <i className="ti ti-arrow-left me-1"></i>
                                            Back
                                        </button>
                                    </div>
                                    <div className="page-header-title">
                                        <h4 className="mb-0">
                                            <i className="ti ti-clipboard-check me-2"></i>
                                            Approval Review
                                        </h4>
                                    </div>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-0 mt-1">
                                            <li className="breadcrumb-item">
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate("/workflows");
                                                    }}
                                                >
                                                    Workflows
                                                </a>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <a
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate("/workflows/approvals/pending");
                                                    }}
                                                >
                                                    Pending Approvals
                                                </a>
                                            </li>
                                            <li className="breadcrumb-item active">
                                                {instance?.entity_id || id}
                                            </li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflow / History tab toggle */}
            <div className="row mb-3">
                <div className="col-12">
                    <ul className="nav nav-pills gap-2">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link ${mainTab === "workflow" ? "active" : ""}`}
                                onClick={() => setMainTab("workflow")}
                            >
                                <i className="ti ti-clipboard-check me-1"></i>Workflow
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link ${mainTab === "history" ? "active" : ""}`}
                                onClick={() => { setMainTab("history"); loadHistory(); }}
                            >
                                <i className="ti ti-history me-1"></i>History
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {mainTab === "history" ? (
                <div className="row mb-3">
                    <div className="col-12">
                        <HistoryTab
                            loading={loadingHistory}
                            error={historyError}
                            rows={history}
                            onViewPin={(row) => setHistoryPinPreview(row)}
                            getUserName={getUserName}
                        />
                    </div>
                </div>
            ) : (
            <>
            {/* Instance Summary */}
            {instance && (
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="card mb-0">
                            <div className="card-body py-3">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-1">{instance.entity_id}</h5>
                                        <div className="d-flex gap-2 flex-wrap mb-1">
                                            <span className="badge bg-info">{instance.entity_type}</span>
                                            <span className={`badge bg-${wfStatus.color}`}>
                                                {wfStatus.label}
                                            </span>
                                        </div>
                                        {instance.started_at && (
                                            <p className="text-muted small mb-0">
                                                <i className="ti ti-calendar me-1"></i>
                                                Started: {formatDateTime(instance.started_at)}
                                            </p>
                                        )}
                                        {instance.completed_at && (
                                            <p className="text-muted small mb-0">
                                                <i className="ti ti-check me-1"></i>
                                                Completed: {formatDateTime(instance.completed_at)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-md-6 mt-3 mt-md-0 ps-md-4">
                                        <div className="text-muted small mb-1">
                                            {getApprovedStepsCount()} of {steps.length} steps completed
                                        </div>
                                        <div className="progress w-100 mb-2" style={{ height: "8px" }}>
                                            <div
                                                className="progress-bar bg-success"
                                                style={{
                                                    width: `${
                                                        steps.length
                                                            ? Math.round(
                                                                  (getApprovedStepsCount() /
                                                                      steps.length) *
                                                                      100
                                                              )
                                                            : 0
                                                    }%`
                                                }}
                                            />
                                        </div>
                                        {docDetails && (
                                            <div className="d-flex flex-wrap align-items-center gap-2 pt-2 border-top">
                                                {docDetails.document_reference && (
                                                    <span className="badge bg-secondary">{docDetails.document_reference}</span>
                                                )}
                                                {docDetails.document_type_name && (
                                                    <span className="badge bg-info">{docDetails.document_type_name}</span>
                                                )}
                                                {docDetails.status_label && (
                                                    <span className={`badge bg-${docStatusColor}`}>{docDetails.status_label}</span>
                                                )}
                                                <span className="text-muted small">
                                                    <i className="ti ti-calendar-plus me-1"></i>
                                                    Created: {formatDateTime(docDetails.created_at)}
                                                </span>
                                                <span className="text-muted small">
                                                    <i className="ti ti-upload me-1"></i>
                                                    Uploaded: {formatDateTime(docVersion.uploaded_at)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sent Back banner */}
            {instance?.status === "SENT_BACK" && (
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="alert alert-warning mb-0 py-2 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                            <div>
                                <i className="ti ti-corner-up-left me-2"></i>
                                {isSentBackToSubmitter
                                    ? "This request was sent back to the submitter for changes."
                                    : `This request was sent back to Step ${sentBackStep.step_order} — ${sentBackStep.step_name} for changes.`}
                            </div>
                            {canResubmit && (
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        style={{ minWidth: 220 }}
                                        placeholder="Optional resubmit comment..."
                                        value={resubmitComment}
                                        onChange={(e) => setResubmitComment(e.target.value)}
                                        disabled={resubmitting}
                                    />
                                    <button
                                        className="btn btn-sm btn-primary text-nowrap"
                                        onClick={handleResubmit}
                                        disabled={resubmitting}
                                    >
                                        {resubmitting ? (
                                            <span className="spinner-border spinner-border-sm me-1" />
                                        ) : (
                                            <i className="ti ti-send me-1"></i>
                                        )}
                                        Resubmit
                                    </button>
                                </div>
                            )}
                        </div>
                        {resubmitError && (
                            <div className="alert alert-danger mt-2 mb-0 py-2">{resubmitError}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Entity Details + Wizard — a DOCUMENT approval lays these out as two
                columns (preview on the left, supporting docs + the approval
                wizard on the right); every other entity type keeps the original
                stacked, full-width layout since it has no preview to pair against. */}
            {(() => {
                const wizardCard = (
                    <div className="card">

                        {/* Current Step Content */}
                        {currentStep ? (
                            <div className="card-body py-3">
                                {/* Step Header */}
                                <div className="d-flex align-items-start justify-content-between mb-2 flex-wrap gap-2">
                                    <div>
                                        <h6 className="mb-1">
                                            Step {currentStep.step_order}: {currentStep.step_name}
                                        </h6>
                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <StatusBadge status={currentStep.status} />
                                            {currentStep.is_last_step && (
                                                <span className="badge bg-dark">Final Step</span>
                                            )}
                                            {canApproveCurrentStep && (
                                                <span className="badge bg-warning text-dark">
                                                    <i className="ti ti-hand-click me-1"></i>
                                                    Action Required
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-muted small text-end">
                                        {currentStep.approval_mode && (
                                            <div>
                                                <i className="ti ti-users me-1"></i>
                                                {currentStep.approval_mode === "ANY"
                                                    ? "Any approver"
                                                    : "All approvers required"}
                                            </div>
                                        )}
                                        {currentStep.due_date && (
                                            <div>
                                                <i className="ti ti-calendar me-1"></i>
                                                Due: {formatDateTime(currentStep.due_date)}
                                            </div>
                                        )}
                                        {currentStep.acted_at && (
                                            <div>
                                                <i className="ti ti-clock me-1"></i>
                                                Acted: {formatDateTime(currentStep.acted_at)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="my-2" />

                                {/* Approvers */}
                                <h6 className="mb-2 text-muted">
                                    <i className="ti ti-users me-1"></i>Approvers
                                </h6>
                                {loadingDetail ? (
                                    <div className="text-center py-3">
                                        <div
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                        />
                                        <span className="ms-2 text-muted">Loading approvers...</span>
                                    </div>
                                ) : currentStepDetail ? (
                                    <>
                                        {approvers.length === 0 ? (
                                            <p className="text-muted mb-0 text-center py-2">
                                                No approvers assigned to this step
                                            </p>
                                        ) : (
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                                    alignItems: "start",
                                                    gap: "8px"
                                                }}
                                            >
                                                {visibleApprovers.map((approver, idx) => (
                                                    <ApproverCard
                                                        key={getApproverActionId(approver) ?? idx}
                                                        approver={approver}
                                                        stepStatus={currentStep?.status}
                                                        onApprove={handleApproverApprove}
                                                        onReject={handleApproverReject}
                                                        onSendBack={handleApproverSendBack}
                                                        onDelegate={handleApproverDelegate}
                                                        getUserName={getUserName}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {hasMoreApprovers && (
                                            <div className="d-flex align-items-center justify-content-between pt-2 mt-1 border-top">
                                                <span className="text-muted small">
                                                    Showing {APPROVER_MAX_VISIBLE_ITEMS} of {approvers.length}
                                                </span>
                                                <a
                                                    href="#"
                                                    className="small fw-semibold"
                                                    onClick={(e) => { e.preventDefault(); setShowApproversDrawer(true); }}
                                                >
                                                    <i className="ti ti-users me-1"></i>
                                                    See all {approvers.length} approvers
                                                </a>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted mb-0 text-center py-2">
                                        No approver details available
                                    </p>
                                )}
                            </div>
                        ) : null}

                        {/* Wizard Navigation Footer */}
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => goToStep(currentStepIndex - 1)}
                                disabled={isFirstStep}
                            >
                                <i className="ti ti-arrow-left me-1"></i>
                                Previous
                            </button>
                            <span className="text-muted small">
                                Step {currentStepIndex + 1} of {steps.length}
                            </span>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => goToStep(currentStepIndex + 1)}
                                disabled={isLastStep || !canGoToStep(currentStepIndex + 1)}
                                title={!canGoToStep(currentStepIndex + 1) ? "Complete the current step before proceeding" : undefined}
                            >
                                Next
                                <i className="ti ti-arrow-right ms-1"></i>
                            </button>
                        </div>

                    </div>
                );

                if (instance && isDocumentEntityType(instance.entity_type)) {
                    return (
                        <div className="row mb-3">
                            <div className="col-lg-6 mb-3 mb-lg-0">
                                {/* Document preview — left column */}
                                {loadingEntityDetail ? (
                                    <div className="card">
                                        <div className="card-body text-center py-5">
                                            <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                            <span className="ms-2 text-muted">Loading document...</span>
                                        </div>
                                    </div>
                                ) : entityDetailError ? (
                                    <div className="alert alert-warning mb-0">
                                        <i className="ti ti-alert-triangle me-2"></i>
                                        {entityDetailError}
                                    </div>
                                ) : entityDetailsValue == null ? (
                                    <div className="alert alert-light border mb-0">
                                        <i className="ti ti-info-circle me-2"></i>
                                        No entity details were provided for this workflow instance.
                                    </div>
                                ) : (
                                    <DocumentDetail
                                        details={entityDetailsValue}
                                        documentPreview={entityDetail?.document_preview ?? entityDetail?.documentPreview}
                                        currentUserId={currentUserId}
                                        onSigned={() => loadEntityDetail(id)}
                                        placingPin={placingPin}
                                        onPlacePin={handlePlacePin}
                                        onMovePin={handleMovePin}
                                        pendingPin={commentState.pinX != null ? { x: commentState.pinX, y: commentState.pinY, note: commentState.comment } : null}
                                    />
                                )}
                            </div>
                            <div className="col-lg-6">
                                {/* Supporting Documents — right column, above the approval wizard */}
                                <div className="card mb-3">
                                    <div className="card-header py-2">
                                        <h6 className="mb-0">
                                            <i className="ti ti-paperclip me-2"></i>
                                            Supporting Documents
                                        </h6>
                                    </div>
                                    <div className="card-body py-3">
                                        <DocumentSupportingDocs documentId={entityDetailsValue?.id} />
                                    </div>
                                </div>

                                {wizardCard}
                            </div>
                        </div>
                    );
                }

                return (
                    <>
                        {/* Entity Details (generic — every non-document entity type) */}
                        {instance && (
                            <div className="row mb-3">
                                <div className="col-12">
                                    <div className="card mb-0">
                                        <div className="card-header py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <h6 className="mb-0">
                                                <i className="ti ti-file-text me-2"></i>
                                                Entity Details
                                            </h6>
                                            {!loadingEntityDetail && (
                                                <span className={`badge bg-${entitySourceCfg.color}`}>
                                                    <i className={`ti ${entitySourceCfg.icon} me-1`}></i>
                                                    {entitySourceCfg.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="card-body py-3">
                                            {loadingEntityDetail ? (
                                                <div className="text-center py-3">
                                                    <div
                                                        className="spinner-border spinner-border-sm text-primary"
                                                        role="status"
                                                    />
                                                    <span className="ms-2 text-muted">Loading entity details...</span>
                                                </div>
                                            ) : entityDetailError ? (
                                                <div className="alert alert-warning mb-0">
                                                    <i className="ti ti-alert-triangle me-2"></i>
                                                    {entityDetailError}
                                                </div>
                                            ) : entityDetailsValue == null ? (
                                                <div className="alert alert-light border mb-0">
                                                    <i className="ti ti-info-circle me-2"></i>
                                                    No entity details were provided for this workflow instance.
                                                </div>
                                            ) : (
                                                // No generic entity_type/entity_id badge row here — the Instance
                                                // Summary card above already shows both, and every per-type
                                                // renderer (DocumentDetail, ...) repeats them again in its own
                                                // header. Showing them a third time on their own line was pure
                                                // duplication.
                                                renderEntityDetailsByType(
                                                    entityDetail?.entity_type || instance?.entity_type,
                                                    entityDetailsValue,
                                                    entityDetail?.document_preview ?? entityDetail?.documentPreview
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wizard */}
                        <div className="row">
                            <div className="col-12">{wizardCard}</div>
                        </div>
                    </>
                );
            })()}
            </>
            )}

            {/* Action Modal — rendered via portal so DashboardLayout stacking context cannot block it */}
            {/* Docked as a right-side panel, not a centered modal, and with no
                backdrop — the document preview stays fully visible and
                clickable at all times, so placing a sticky-note pin never
                needs to hide/show this panel (that used to be jarring and,
                per report, could leave the panel covering most of the
                document anyway). */}
            {actionModal.open && createPortal(
                <>
                    {/* The `.modal` class itself defines all the --bs-modal-*
                        CSS variables .modal-content/.modal-header/etc rely on
                        for background/border/padding — dropping it entirely
                        (as an earlier version of this did) left the panel
                        transparent, since those variables aren't defined
                        anywhere else. Keep `.modal`, just override its default
                        full-viewport left/width to dock right instead. */}
                    <div
                        className="modal d-block"
                        role="dialog"
                        style={{
                            left: "auto",
                            right: 0,
                            width: "min(440px, 100vw)",
                            zIndex: 1055,
                        }}
                    >
                    <div
                        className="modal-content shadow-lg"
                        style={{ height: "100%", borderRadius: 0, borderLeft: "1px solid rgba(0,0,0,0.15)" }}
                    >
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {actionModal.action === "APPROVE" ? (
                                            <>
                                                <i className="ti ti-circle-check me-2 text-success"></i>
                                                Approve Step
                                            </>
                                        ) : actionModal.action === "SEND_BACK" ? (
                                            <>
                                                <i className="ti ti-corner-up-left me-2 text-warning"></i>
                                                Send Back
                                            </>
                                        ) : actionModal.action === "DELEGATE" ? (
                                            <>
                                                <i className="ti ti-user-share me-2 text-secondary"></i>
                                                Delegate Approval
                                            </>
                                        ) : (
                                            <>
                                                <i className="ti ti-circle-x me-2 text-danger"></i>
                                                Reject Step
                                            </>
                                        )}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={closeActionModal}
                                        disabled={processing}
                                    />
                                </div>
                                <div className="modal-body" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                                    {actionModal.action === "REJECT" && (
                                        <div className="alert alert-warning">
                                            <i className="ti ti-alert-triangle me-2"></i>
                                            Rejecting this step will terminate the workflow and skip all
                                            remaining steps.
                                        </div>
                                    )}
                                    {actionModal.action === "SEND_BACK" && (
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Send back to <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                value={actionModal.targetStepOrder}
                                                onChange={(e) =>
                                                    setActionModal((prev) => ({
                                                        ...prev,
                                                        targetStepOrder: e.target.value
                                                    }))
                                                }
                                                disabled={processing}
                                            >
                                                <option value="">Select a target...</option>
                                                {sendBackTargetOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {actionModal.action === "DELEGATE" && (
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Delegate to <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                value={delegateUserId}
                                                onChange={(e) => setDelegateUserId(e.target.value)}
                                                disabled={processing}
                                            >
                                                <option value="">Select a user...</option>
                                                {users
                                                    .filter((u) => u.is_active && u.id !== currentUserId)
                                                    .map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.first_name} {u.other_name} ({u.email_address})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Comment{" "}
                                            {(actionModal.action === "REJECT" || actionModal.action === "SEND_BACK") && (
                                                <span className="text-danger">*</span>
                                            )}
                                        </label>
                                        <CommentComposer
                                            value={commentState}
                                            onChange={setCommentState}
                                            required={actionModal.action === "REJECT" || actionModal.action === "SEND_BACK"}
                                            disabled={processing}
                                            placeholder={
                                                actionModal.action === "SEND_BACK"
                                                    ? "Reason for sending back (required)..."
                                                    : actionModal.action === "REJECT"
                                                    ? "Reason for rejection (required)..."
                                                    : actionModal.action === "DELEGATE"
                                                    ? "Optional note for the delegate..."
                                                    : "Optional comment..."
                                            }
                                            externalPin={{
                                                placing: placingPin,
                                                onStartPlacing: () => setPlacingPin(true)
                                            }}
                                        />
                                    </div>
                                    {actionModal.action === "APPROVE" && (
                                        <div className="mb-3">
                                            {loadingSignature ? (
                                                <div className="text-muted small">
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Checking for a signature on file...
                                                </div>
                                            ) : mySignature ? (
                                                <div className="form-check d-flex align-items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="signApprovalCheck"
                                                        checked={signatureChecked}
                                                        onChange={(e) => setSignatureChecked(e.target.checked)}
                                                        disabled={processing}
                                                    />
                                                    <label
                                                        className="form-check-label d-flex align-items-center gap-2 mb-0"
                                                        htmlFor="signApprovalCheck"
                                                    >
                                                        Sign this approval with my signature
                                                        <img
                                                            src={mySignature.public_url}
                                                            alt="My signature"
                                                            style={{
                                                                height: 28,
                                                                border: "1px solid #dee2e6",
                                                                borderRadius: 4,
                                                                background: "#fff",
                                                                padding: 2
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            ) : null}
                                            {signatureChecked && otpRequired && (
                                                <div className="mt-2">
                                                    <EsignOtpBox
                                                        purpose="APPROVE"
                                                        code={approvalOtpCode}
                                                        onCodeChange={setApprovalOtpCode}
                                                        disabled={processing}
                                                    />
                                                </div>
                                            )}
                                            {!mySignature && !loadingSignature && (
                                                <div>
                                                    <div className="text-muted small mb-2">
                                                        <i className="ti ti-info-circle me-1"></i>
                                                        No signature on file.{" "}
                                                        {!drawingApprovalSignature && (
                                                            <>
                                                                <a
                                                                    href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setDrawingApprovalSignature(true);
                                                                    }}
                                                                >
                                                                    Draw one now
                                                                </a>{" "}
                                                                or{" "}
                                                                {currentUserId != null && (
                                                                    <a
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            navigate(`/users/edit/${currentUserId}`);
                                                                        }}
                                                                    >
                                                                        upload one in your profile
                                                                    </a>
                                                                )}
                                                                .
                                                            </>
                                                        )}
                                                    </div>
                                                    {drawingApprovalSignature && (
                                                        <div style={{ maxWidth: 360 }}>
                                                            <SignaturePad
                                                                onSave={handleDrawnApprovalSignature}
                                                                saving={savingApprovalSignature}
                                                                height={130}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-link text-muted px-0 mt-1"
                                                                onClick={() => setDrawingApprovalSignature(false)}
                                                                disabled={savingApprovalSignature}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {actionError && (
                                        <div className="alert alert-danger mb-0">
                                            <i className="ti ti-alert-circle me-2"></i>
                                            {actionError}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeActionModal}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${
                                            actionModal.action === "APPROVE"
                                                ? "btn-success"
                                                : actionModal.action === "SEND_BACK"
                                                ? "btn-warning"
                                                : actionModal.action === "DELEGATE"
                                                ? "btn-secondary"
                                                : "btn-danger"
                                        }`}
                                        onClick={handleAction}
                                        disabled={
                                            processing ||
                                            placingPin ||
                                            actionModal.stepApproverId == null ||
                                            !isCommentComposerValid(commentState, actionModal.action === "REJECT" || actionModal.action === "SEND_BACK") ||
                                            (actionModal.action === "SEND_BACK" && actionModal.targetStepOrder === "") ||
                                            (actionModal.action === "DELEGATE" && !delegateUserId) ||
                                            (actionModal.action === "APPROVE" && signatureChecked && otpRequired && !approvalOtpCode.trim())
                                        }
                                    >
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                {actionModal.action === "APPROVE"
                                                    ? "Approving..."
                                                    : actionModal.action === "SEND_BACK"
                                                    ? "Sending back..."
                                                    : actionModal.action === "DELEGATE"
                                                    ? "Delegating..."
                                                    : "Rejecting..."}
                                            </>
                                        ) : (
                                            <>
                                                <i
                                                    className={`ti ${
                                                        actionModal.action === "APPROVE"
                                                            ? "ti-check"
                                                            : actionModal.action === "SEND_BACK"
                                                            ? "ti-corner-up-left"
                                                            : actionModal.action === "DELEGATE"
                                                            ? "ti-user-share"
                                                            : "ti-x"
                                                    } me-1`}
                                                ></i>
                                                {actionModal.action === "APPROVE"
                                                    ? "Confirm Approve"
                                                    : actionModal.action === "SEND_BACK"
                                                    ? "Confirm Send Back"
                                                    : actionModal.action === "DELEGATE"
                                                    ? "Confirm Delegate"
                                                    : "Confirm Reject"}
                                            </>
                                        )}
                                    </button>
                                </div>
                    </div>
                    </div>
                </>,
                document.body
            )}

            {/* Approvers Slide-out Drawer */}
            {createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowApproversDrawer(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1058,
                            backgroundColor: "rgba(0,0,0,0.45)",
                            opacity: showApproversDrawer ? 1 : 0,
                            pointerEvents: showApproversDrawer ? "auto" : "none",
                            transition: "opacity 0.25s ease"
                        }}
                    />

                    {/* Drawer panel */}
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: "min(100vw, 560px)",
                            zIndex: 1059,
                            backgroundColor: "var(--bs-card-bg, #fff)",
                            boxShadow: "-6px 0 24px rgba(0,0,0,0.18)",
                            transform: showApproversDrawer ? "translateX(0)" : "translateX(100%)",
                            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}
                    >
                        {/* Drawer header */}
                        <div
                            className="d-flex align-items-center justify-content-between px-4 py-3"
                            style={{ borderBottom: "1px solid #dee2e6", flexShrink: 0 }}
                        >
                            <h5 className="mb-0">
                                <i className="ti ti-users me-2"></i>
                                All Approvers
                                <span className="badge bg-secondary ms-2" style={{ fontSize: "12px" }}>
                                    {approvers.length}
                                </span>
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setShowApproversDrawer(false)}
                            />
                        </div>

                        {/* Step context pill */}
                        {currentStep && (
                            <div
                                className="px-4 py-2 d-flex align-items-center gap-2"
                                style={{ borderBottom: "1px solid #f0f0f0", flexShrink: 0, backgroundColor: "#f8f9fa" }}
                            >
                                <span className="text-muted small">
                                    Step {currentStep.step_order}: {currentStep.step_name}
                                </span>
                                <StatusBadge status={currentStep.status} />
                                {currentStep.approval_mode && (
                                    <span className="badge bg-light text-dark border">
                                        {currentStep.approval_mode === "ANY" ? "Any approver" : "All required"}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Scrollable approver list */}
                        <div className="flex-fill overflow-auto p-3">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                    alignItems: "start",
                                    gap: "8px"
                                }}
                            >
                                {approvers.map((approver, idx) => (
                                    <ApproverCard
                                        key={getApproverActionId(approver) ?? idx}
                                        approver={approver}
                                        stepStatus={currentStep?.status}
                                        onApprove={handleApproverApprove}
                                        onReject={handleApproverReject}
                                        onSendBack={handleApproverSendBack}
                                        onDelegate={handleApproverDelegate}
                                        getUserName={getUserName}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Drawer footer */}
                        <div
                            className="d-flex justify-content-end px-4 py-3"
                            style={{ borderTop: "1px solid #dee2e6", flexShrink: 0 }}
                        >
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowApproversDrawer(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* History tab — "View placement" modal for a STICKY_NOTE history row.
                Reuses whatever document preview data is already loaded for this
                instance (entityDetail/document_preview) rather than fetching
                anything new — a single static pin, no placement capture. */}
            {historyPinPreview && (() => {
                const preview = entityDetail?.document_preview ?? entityDetail?.documentPreview ?? {};
                const previewUrl = docDetails?.preview?.url || preview?.preview_url || preview?.url;
                const mimeType = docVersion?.mime_type || preview?.mime_type;
                const isPdf = mimeType === "application/pdf";
                const isImage = typeof mimeType === "string" && mimeType.startsWith("image/");
                return (
                    <div
                        className="modal fade show d-block"
                        style={{ background: "rgba(0,0,0,0.6)", zIndex: 9500 }}
                        onClick={() => setHistoryPinPreview(null)}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title"><i className="ti ti-map-pin me-2"></i>Sticky Note Placement</h5>
                                    <button className="btn-close" onClick={() => setHistoryPinPreview(null)}></button>
                                </div>
                                <div className="modal-body p-0">
                                    {previewUrl ? (
                                        <PinPlacementLayer pins={[{ x: historyPinPreview.pin_x, y: historyPinPreview.pin_y, note: historyPinPreview.comment }]}>
                                            {isPdf ? (
                                                <iframe
                                                    src={previewUrl}
                                                    title="Document Preview"
                                                    style={{ width: "100%", height: "500px", border: "none" }}
                                                />
                                            ) : isImage ? (
                                                <div className="text-center p-3">
                                                    <img src={previewUrl} alt="Document preview" style={{ maxWidth: "100%", maxHeight: "500px" }} />
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-5">
                                                    <i className="ti ti-file-unknown" style={{ fontSize: 28 }}></i>
                                                    <p className="mb-0 mt-2 small">Preview not supported for this file type.</p>
                                                </div>
                                            )}
                                        </PinPlacementLayer>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            <i className="ti ti-file-off" style={{ fontSize: 28 }}></i>
                                            <p className="mb-0 mt-2 small">Preview not available.</p>
                                        </div>
                                    )}
                                </div>
                                {historyPinPreview.comment && (
                                    <div className="modal-footer d-block py-2">
                                        <CommentDisplay
                                            comment={historyPinPreview.comment}
                                            commentStyle="STICKY_NOTE"
                                            pinX={historyPinPreview.pin_x}
                                            pinY={historyPinPreview.pin_y}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
            </div>
        </DashboardLayout>
    );
}
