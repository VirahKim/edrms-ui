import React, { useEffect, useState } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { createParty, listParties } from "../../../api/registersApi";
import { toast } from "./EDMSToast";
import apiClient from "../../../api/apiClient";
import { FieldLabel } from "./Tooltip";
import CrossReferencesSection from "./CrossReferencesSection";

const extractList = (data, key) =>
  Array.isArray(data) ? data
  : Array.isArray(data?.[key]) ? data[key]
  : Array.isArray(data?.data) ? data.data
  : Array.isArray(data?.data?.[key]) ? data.data[key]
  : Array.isArray(data?.items) ? data.items
  : [];

const selectStyles = { menuPortal: (b) => ({ ...b, zIndex: 9999 }) };

const SuggestedBadge = () => (
  <span className="badge bg-info-subtle text-info border ms-2" style={{ fontSize: "0.65rem" }}>
    <i className="ti ti-sparkles me-1"></i>Suggested — please review
  </span>
);

/** The note shown while OCR/AI run in the background. Not a button, not blocking. */
export const SuggestionNote = ({ state }) => {
  if (state === "running") {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2 py-2 mb-3" role="status">
        <span className="spinner-border spinner-border-sm flex-shrink-0"></span>
        <small>OCR and AI are reading this document in the background. Suggestions will appear in the fields below for your review — you can keep filling them in yourself meanwhile.</small>
      </div>
    );
  }
  if (state === "ready-empty") {
    return <div className="text-muted small mb-3"><i className="ti ti-info-circle me-1"></i>OCR and AI finished but found nothing to suggest for this document. Please fill in the details.</div>;
  }
  if (state === "none") {
    return <div className="text-muted small mb-3"><i className="ti ti-info-circle me-1"></i>OCR and AI suggestions are not available for this file type. Please fill in the details.</div>;
  }
  if (state === "failed") {
    return <div className="text-muted small mb-3"><i className="ti ti-info-circle me-1"></i>OCR and AI could not read this document. Please fill in the details.</div>;
  }
  return null;
};

/**
 * The Inward Register details form shared by Single, Bulk and Email upload.
 *   value        form state (see emptyInwardForm)
 *   onChange     (patch) => void
 *   suggestions  { source_name, subject, … } from OCR/AI — auto-filled into fields that are
 *                still empty and untouched; never overwrites what the user typed
 *   fileLabel    the file chosen in step 1 ("Where Filed")
 *   onChangeFile () => void — takes the user back to step 1
 */
const InwardDetailsForm = ({
  value, onChange, suggestions, confidentialityLevels, fileLabel, onChangeFile, documentId, fileId,
}) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [parties, setParties] = useState([]);
  const [creatingParty, setCreatingParty] = useState(false);

  useEffect(() => {
    listParties("SOURCE")
      .then((res) => setParties(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch(() => {});
  }, []);

  // A name that is not in the list is added once and selected straight away.
  const addParty = async (raw) => {
    const name = raw.trim();
    if (!name) return;
    setCreatingParty(true);
    try {
      const res = await createParty({ name, party_kind: "SOURCE" });
      const party = res?.data ?? res;
      setParties((prev) => (prev.some((p) => p.id === party.id) ? prev : [...prev, party]));
      edit("source_name", party.name);
      toast.success(`Added "${party.name}".`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not add the name.");
    } finally {
      setCreatingParty(false);
    }
  };

  useEffect(() => {
    Promise.allSettled([apiClient.get("/IAmAPI/api/users"), apiClient.get("/IAmAPI/api/roles")]).then(([u, r]) => {
      if (u.status === "fulfilled") setUsers(extractList(u.value.data, "users"));
      if (r.status === "fulfilled") setRoles(extractList(r.value.data, "roles"));
    });
  }, []);

  // Fold new suggestions into empty, untouched fields.
  useEffect(() => {
    if (!suggestions) return;
    const v = value;
    const patch = {};
    const suggested = { ...v._suggested };
    Object.entries(suggestions).forEach(([k, s]) => {
      if (!s || v._touched[k] || v._suggested[k] || v[k]) return;
      patch[k] = s;
      suggested[k] = true;
    });
    if (Object.keys(patch).length) onChange({ ...patch, _suggested: suggested });
  }, [suggestions]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (k, v) => onChange({
    [k]: v,
    _touched: { ...value._touched, [k]: true },
    _suggested: { ...value._suggested, [k]: false },
  });

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.first_name || ""} ${u.other_name || ""}`.trim() + (u.email_address ? ` (${u.email_address})` : ""),
  }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
  const pick = (options, ids) => options.filter((o) => ids.includes(o.value));
  const restricting = value.confidentiality_level !== "PUBLIC";

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <FieldLabel label="S/NO" tooltip="Leave blank to auto-generate the next number in this year's Inward Register, or type the S/NO you want." />
        <input type="number" min={1} className="form-control" placeholder="Auto-generate"
               value={value.serial_no} onChange={(e) => edit("serial_no", e.target.value)} />
      </div>

      <div className="col-md-4">
        <FieldLabel label="Date Received" required />
        <input type="date" className="form-control" value={value.date_received}
               onChange={(e) => edit("date_received", e.target.value)} />
        {value._suggested.date_received && <SuggestedBadge />}
      </div>

      <div className="col-md-4">
        <FieldLabel label="Folio Number" tooltip="Assigned automatically from the file you chose. Change it only if you need to." />
        <input type="number" min={1} className="form-control" value={value.folio_no}
               onChange={(e) => edit("folio_no", e.target.value)} />
      </div>

      <div className="col-12">
        <FieldLabel label="Received From" required tooltip="Pick who the document was received from. If they are not in the list, type the name and choose Add - it is saved and selected for you." />
        <CreatableSelect
          options={parties.map((p) => ({ value: p.name, label: p.name }))}
          value={value.source_name ? { value: value.source_name, label: value.source_name } : null}
          onChange={(opt) => edit("source_name", opt ? opt.value : "")}
          onCreateOption={addParty}
          isClearable
          isLoading={creatingParty}
          styles={selectStyles}
          menuPortalTarget={document.body}
          placeholder="Select, or type a new name to add…"
          formatCreateLabel={(input) => `Add "${input}"`}
        />
        {value._suggested.source_name && <SuggestedBadge />}
      </div>

      <div className="col-md-6">
        <FieldLabel label="Reference Number" tooltip="The sender's own reference number, as written on their letter." />
        <input type="text" className="form-control" value={value.sender_ref_no}
               onChange={(e) => edit("sender_ref_no", e.target.value)} />
        {value._suggested.sender_ref_no && <SuggestedBadge />}
      </div>

      <div className="col-md-6">
        <FieldLabel label="Reference Date" tooltip="The date on the sender's letter." />
        <input type="date" className="form-control" value={value.sender_ref_date}
               onChange={(e) => edit("sender_ref_date", e.target.value)} />
        {value._suggested.sender_ref_date && <SuggestedBadge />}
      </div>

      <div className="col-12">
        <FieldLabel label="Subject" required />
        <input type="text" className="form-control" value={value.subject}
               onChange={(e) => edit("subject", e.target.value)} />
        {value._suggested.subject && <SuggestedBadge />}
      </div>

      <div className="col-12">
        <FieldLabel label="Where Filed" tooltip="The file you selected in step 1. The document is filed here and takes the folio number above." />
        <div className="form-control bg-light d-flex align-items-center justify-content-between">
          <span className="text-truncate"><i className="ti ti-folder text-warning me-1"></i>{fileLabel || "—"}</span>
          {onChangeFile && (
            <button type="button" className="btn btn-link btn-sm p-0 text-nowrap" onClick={onChangeFile}>Change</button>
          )}
        </div>
      </div>

      <CrossReferencesSection value={value} onChange={onChange} documentId={documentId} fileId={fileId} />

      <div className="col-12">
        <FieldLabel label="Confidentiality"
          tooltip="Pick a level, then - for anything above Public - limit who can open this document to specific people or roles." />
        <select className="form-select" value={value.confidentiality_level}
                onChange={(e) => onChange({ confidentiality_level: e.target.value })}>
          {confidentialityLevels.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>

      {restricting && (
        <>
          <div className="col-md-6">
            <label className="form-label mb-1">Restrict to people</label>
            <Select isMulti options={userOptions} styles={selectStyles} menuPortalTarget={document.body}
                    placeholder="Anyone allowed by the level above" value={pick(userOptions, value.restricted_user_ids)}
                    onChange={(sel) => onChange({ restricted_user_ids: (sel || []).map((o) => o.value) })} />
          </div>
          <div className="col-md-6">
            <label className="form-label mb-1">Restrict to roles</label>
            <Select isMulti options={roleOptions} styles={selectStyles} menuPortalTarget={document.body}
                    placeholder="Anyone allowed by the level above" value={pick(roleOptions, value.restricted_role_ids)}
                    onChange={(sel) => onChange({ restricted_role_ids: (sel || []).map((o) => o.value) })} />
          </div>
        </>
      )}
    </div>
  );
};

export default InwardDetailsForm;
