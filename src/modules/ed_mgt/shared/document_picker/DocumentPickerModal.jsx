import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDocuments, getDocumentTypes } from "../../../../api/edmsApi";

/**
 * DocumentPickerModal — reusable "attach an existing EDMS document" picker.
 *
 * No component like this existed anywhere in the codebase before — every module
 * that needed to attach a file built its own bespoke upload/attach flow. This one
 * is deliberately generic (search + pick, nothing procurement-specific) and lives
 * under modules/shared so any module (tenders, HR contracts, cases, ...) can
 * reuse it, matching the "EDMS stays standalone/generic" decision for this
 * feature. Rendered via createPortal so it never fights a parent's stacking
 * context (unlike the older FilePickerModal, which relies on manual z-index).
 *
 * Props:
 *   title        string     — modal title
 *   excludeIds   array      — document ids to disable (already attached)
 *   confirmLabel string     — text on the confirm button
 *   onPick       fn(document) — called with the chosen document summary row
 *   onClose      fn
 *   zBase        number     — z-index base (default 1050), bump for stacked modals
 */
const DocumentPickerModal = ({
  title = "Attach Document",
  excludeIds = [],
  confirmLabel = "Attach",
  onPick,
  onClose,
  zBase = 1050,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [docTypes, setDocTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const loadDocuments = async (textQuery, documentTypeId) => {
    setLoading(true);
    setError("");
    try {
      const res = await getDocuments({
        text_query: textQuery || undefined,
        document_type_id: documentTypeId || undefined,
        page: 1,
        page_size: 20,
      });
      setDocuments(res.items || []);
    } catch (err) {
      console.error("Failed to load documents", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments("", "");
    getDocumentTypes().then((r) => setDocTypes(r?.data?.items || r?.data || [])).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDocuments(search, typeFilter);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setTypeFilter(value);
    loadDocuments(search, value);
  };

  return createPortal(
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: zBase }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: zBase + 10 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-file-search me-2 text-primary" />
                {title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body p-3">
              <form className="d-flex gap-2 mb-3" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by title or reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="form-select form-select-sm"
                  style={{ maxWidth: 160 }}
                  value={typeFilter}
                  onChange={handleTypeChange}
                >
                  <option value="">All types</option>
                  {docTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="submit" className="btn btn-sm btn-outline-primary">
                  <i className="ti ti-search" />
                </button>
              </form>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" role="status" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: "0.875rem" }}>
                    No documents found.
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isDisabled = excludeIds.includes(doc.id);
                    const isSelected = selected?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        className={`d-flex align-items-center gap-2 px-2 py-2 rounded mb-1 ${
                          isSelected ? "bg-primary bg-opacity-15 border border-primary border-opacity-25" : isDisabled ? "text-muted" : "hover-bg"
                        }`}
                        style={{ cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.5 : 1 }}
                        onClick={() => !isDisabled && setSelected(doc)}
                      >
                        <i className="ti ti-file-text text-secondary" />
                        <div className="flex-grow-1">
                          <div className={`text-truncate ${isSelected ? "fw-semibold text-primary" : ""}`} style={{ fontSize: "0.875rem" }}>
                            {doc.title}
                          </div>
                          <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                            {doc.document_reference} &middot; {doc.document_type_name} &middot; {doc.status_label || doc.status}
                          </div>
                        </div>
                        {isDisabled && <span className="badge text-bg-secondary" style={{ fontSize: "0.65rem" }}>Attached</span>}
                      </div>
                    );
                  })
                )}
              </div>

              {selected && (
                <div className="px-2 py-2 mt-2 border-top" style={{ fontSize: "0.8rem", backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  <i className="ti ti-file-text me-1 text-primary" />
                  <span className="fw-semibold text-primary">{selected.title}</span>
                </div>
              )}
            </div>

            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={!selected} onClick={() => selected && onPick(selected)}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default DocumentPickerModal;
