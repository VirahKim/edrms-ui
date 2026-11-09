import React, { useEffect, useState } from "react";
import { getFile, getFileDocuments, getRegistries, getCabinets, getShelves } from "../../../../api/edmsApi";
import apiClient from "../../../../api/apiClient";

const SCOPE_META = {
  ORGANIZATION: { icon: "ti-building", label: "Organization-wide" },
  DEPARTMENT:   { icon: "ti-users",    label: "Department" },
  PERSONAL:     { icon: "ti-user",     label: "Personal" },
  SHARED:       { icon: "ti-share",    label: "Shared" },
};

const unwrapList = (r) => r?.data?.items || r?.data || (Array.isArray(r) ? r : []);

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const formatLevel = (code) =>
  code ? code.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const DetailRow = ({ icon, label, children }) => (
  <div className="d-flex align-items-start gap-2 py-2 border-bottom">
    <i className={`ti ${icon} text-muted mt-1`} style={{ width: 18, fontSize: "0.95rem", flexShrink: 0 }} />
    <div className="flex-grow-1" style={{ minWidth: 0 }}>
      <div className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.875rem" }}>{children}</div>
    </div>
  </div>
);

/**
 * Read-only "View Details" card for a file — its reference/volume numbers,
 * scope, confidentiality, physical location (Registry > Cabinet > Shelf),
 * and how many documents it holds. Opened from the file row's kebab menu.
 */
const FileDetailsModal = ({ file, onClose, onEdit }) => {
  const [detail, setDetail] = useState(file);
  const [loading, setLoading] = useState(true);
  const [docCount, setDocCount] = useState(file.cached_document_count ?? null);
  const [registryName, setRegistryName] = useState(null);
  const [cabinetName, setCabinetName] = useState(null);
  const [shelfName, setShelfName] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState(file.department_name || null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFile(file.id)
      .then((r) => { if (!cancelled) setDetail(r?.data || r || file); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  useEffect(() => {
    let cancelled = false;
    getFileDocuments(file.id, { page: 1, page_size: 1 })
      .then((r) => {
        const total = r?.data?.total_count;
        if (!cancelled && total != null) setDocCount(total);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [file.id]);

  // Registry -> Cabinet -> Shelf name lookup, same cascade FileEditModal
  // uses to populate its selects — the file only carries the IDs.
  useEffect(() => {
    if (!detail.registry_id) { setLocationLoading(false); return; }
    let cancelled = false;

    (async () => {
      setLocationLoading(true);
      try {
        const registries = unwrapList(await getRegistries());
        if (cancelled) return;
        setRegistryName(registries.find((x) => String(x.id) === String(detail.registry_id))?.name || null);

        if (detail.cabinet_id) {
          const cabinets = unwrapList(await getCabinets(detail.registry_id));
          if (cancelled) return;
          setCabinetName(cabinets.find((x) => String(x.id) === String(detail.cabinet_id))?.name || null);

          if (detail.shelf_id) {
            const shelves = unwrapList(await getShelves(detail.cabinet_id));
            if (cancelled) return;
            setShelfName(shelves.find((x) => String(x.id) === String(detail.shelf_id))?.name || null);
          }
        }
      } catch {
        // leave whichever names already resolved; row falls back to "Not assigned"
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [detail.registry_id, detail.cabinet_id, detail.shelf_id]);

  // Department name — the tree already denormalizes this for grouping, but
  // the single-file fetch above may only return department_id, so fall
  // back to a dropdown lookup when a name isn't already in hand.
  useEffect(() => {
    if (detail.department_name) { setDepartmentName(detail.department_name); return; }
    if (!detail.department_id) { setDepartmentName(null); return; }
    if (file.department_name && String(file.department_id) === String(detail.department_id)) {
      setDepartmentName(file.department_name);
      return;
    }
    let cancelled = false;
    apiClient
      .get("/IAmAPI/api/departments/dropdown")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : [];
        const dept = list.find((d) => String(d.id) === String(detail.department_id));
        if (!cancelled) setDepartmentName(dept?.name || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.department_id, detail.department_name]);

  const scopeMeta = SCOPE_META[detail.scope] || SCOPE_META.ORGANIZATION;
  const locationParts = [registryName, cabinetName, shelfName].filter(Boolean);
  const hasLocation = !!(detail.registry_id || detail.cabinet_id || detail.shelf_id);

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <i className="ti ti-folder" style={{ color: detail.color || "#007bff" }} />
                File Details
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4 text-muted">
                  <span className="spinner-border spinner-border-sm" />
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                    <div style={{ minWidth: 0 }}>
                      <h5 className="mb-1 text-truncate">{detail.name}</h5>
                      {detail.description && (
                        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>{detail.description}</p>
                      )}
                    </div>
                    <span className="badge rounded-pill text-bg-secondary flex-shrink-0" style={{ fontSize: "0.8rem" }}>
                      <i className="ti ti-files me-1" />
                      {docCount ?? 0} document{docCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="row g-0">
                    <div className="col-md-6">
                      <DetailRow icon="ti-hash" label="Reference No.">
                        {detail.reference_no || "—"}
                      </DetailRow>
                    </div>
                    <div className="col-md-6">
                      <DetailRow icon="ti-stack-2" label="Volume No.">
                        {detail.volume_no || "—"}
                      </DetailRow>
                    </div>
                    <div className="col-md-6">
                      <DetailRow icon={scopeMeta.icon} label="Scope">
                        {scopeMeta.label}
                      </DetailRow>
                    </div>
                    <div className="col-md-6">
                      <DetailRow icon="ti-users" label="Department">
                        {departmentName || "—"}
                      </DetailRow>
                    </div>
                    <div className="col-md-6">
                      <DetailRow icon="ti-shield-lock" label="Confidentiality">
                        {formatLevel(detail.confidentiality_level)}
                      </DetailRow>
                    </div>
                    <div className="col-12">
                      <DetailRow icon="ti-map-pin" label="Physical Location">
                        {locationLoading ? (
                          <span className="text-muted">Loading…</span>
                        ) : hasLocation && locationParts.length > 0 ? (
                          locationParts.join(" › ")
                        ) : (
                          <span className="text-muted">Not assigned</span>
                        )}
                      </DetailRow>
                    </div>
                    {detail.created_at && (
                      <div className="col-md-6">
                        <DetailRow icon="ti-calendar-plus" label="Created">
                          {fmtDate(detail.created_at)}
                        </DetailRow>
                      </div>
                    )}
                    {detail.updated_at && (
                      <div className="col-md-6">
                        <DetailRow icon="ti-calendar-event" label="Last Updated">
                          {fmtDate(detail.updated_at)}
                        </DetailRow>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
              {onEdit && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { onClose(); onEdit(detail); }}
                >
                  <i className="ti ti-pencil me-1" />Edit File
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FileDetailsModal;
