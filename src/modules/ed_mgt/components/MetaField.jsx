import React, { useState, useEffect } from "react";
import { getFieldOptions } from "../../../api/edmsApi";

// Renders one dynamic metadata input for a Meta.DocumentTypes field, keyed
// off field_type. Shared by every ingestion path that captures metadata at
// creation time (single upload, bulk upload, email import) so a new field
// type only needs to be taught here once.
const MetaField = ({ field, value, onChange }) => {
  const [options, setOptions] = useState([]);
  const [optLoading, setOptLoading] = useState(false);

  useEffect(() => {
    if (field.field_type === "LOOKUP" && field.document_type_id) {
      setOptLoading(true);
      getFieldOptions(field.document_type_id, field.id)
        .then((r) => setOptions(r?.data || []))
        .catch(() => {})
        .finally(() => setOptLoading(false));
    }
  }, [field]);

  const inputClass = "form-control form-control-sm";
  const baseProps  = { id: `field-${field.id}`, required: field.is_mandatory };

  switch (field.field_type) {
    case "TEXT":
      return <input {...baseProps} type="text" className={inputClass} value={value || ""} onChange={(e) => onChange(e.target.value)} maxLength={field.validation_rules?.max_length} />;
    case "NUMBER":
      return <input {...baseProps} type="number" className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)} min={field.validation_rules?.min} max={field.validation_rules?.max} />;
    case "DATE":
      return <input {...baseProps} type="date" className={inputClass} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "DATETIME":
      return <input {...baseProps} type="datetime-local" className={inputClass} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "BOOLEAN":
      return (
        <div className="form-check form-switch">
          <input {...baseProps} type="checkbox" className="form-check-input" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        </div>
      );
    case "LOOKUP":
      return (
        <select {...baseProps} className="form-select form-select-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={optLoading}>
          <option value="">{optLoading ? "Loading…" : "Select…"}</option>
          {options.map((o) => <option key={o.id} value={o.option_code}>{o.option_label}</option>)}
        </select>
      );
    default:
      return <input {...baseProps} type="text" className={inputClass} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
};

// Renders the full metadata grid for a set of fields — the "Metadata" section
// under a document type's own fields (title, mandatory marker, error text).
export const MetadataFieldsGrid = ({ typeFields, documentTypeId, metaValues, metaErrors, onFieldChange }) => {
  if (typeFields.length === 0) return null;
  return (
    <div className="col-12">
      <hr />
      <h6 className="fw-semibold mb-3">Metadata</h6>
      <div className="row g-3">
        {typeFields.map((field) => (
          <div key={field.id} className="col-md-6">
            <label htmlFor={`field-${field.id}`} className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>
              {field.field_label}
              {field.is_mandatory && <span className="text-danger ms-1">*</span>}
            </label>
            <MetaField
              field={{ ...field, document_type_id: documentTypeId }}
              value={metaValues[field.field_code]}
              onChange={(val) => onFieldChange(field.field_code, val)}
            />
            {metaErrors[field.field_code] && (
              <div className="text-danger" style={{ fontSize: "0.78rem" }}>{metaErrors[field.field_code]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetaField;
