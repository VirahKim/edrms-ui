import React, { useCallback, useEffect, useState } from "react";
import { getPhysicalEnclosures, addPhysicalEnclosure, removePhysicalEnclosure } from "../../../api/edmsApi";
import { toast } from "./EDMSToast";

const COPY = {
  ENCLOSURE: {
    title: "Physical enclosures",
    icon: "ti-books",
    hint: "Items that came with this document but are kept on paper.",
    empty: "None recorded.",
    subject: "Title and number of copies, e.g. Annual Report - 3 copies",
  },
  REFERENCE: {
    title: "Books and legal documents referenced",
    icon: "ti-book-2",
    hint: "A book, legal document or other source too big to scan. Give its subject and author, or a link to it.",
    empty: "None referenced.",
    subject: "Subject / title",
  },
};

const emptyForm = { description: "", quantity: "", kept_at: "", author: "", link_url: "" };

/**
 * A document's physical items, kept on paper or cited by the letter: list, add, remove.
 *   kind  "ENCLOSURE" - came with the letter;  "REFERENCE" - a book / legal document it cites
 */
const PhysicalEnclosuresPanel = ({ documentId, readOnly = false, kind = "ENCLOSURE", compact = false }) => {
  const copy = COPY[kind];
  const isRef = kind === "REFERENCE";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(() =>
    getPhysicalEnclosures(documentId)
      .then((r) => { setLoadError(""); setItems((Array.isArray(r?.data) ? r.data : []).filter((e) => (e.kind || "ENCLOSURE") === kind)); })
      // Shown where the list would be - not as a pop-up, and not as a failure when it is simply not open to you.
      .catch((e) => {
        const status = e?.response?.status;
        setLoadError(status === 404
          ? "Not available - this letter is no longer open to you."
          : (e?.response?.data?.message || "Could not load this right now."));
      })
      .finally(() => setLoading(false)), [documentId, kind]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      await addPhysicalEnclosure(documentId, { ...form, kind });
      setForm(emptyForm);
      await load();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to add."); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await removePhysicalEnclosure(documentId, id); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || "Failed to remove."); }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className={compact ? "" : "mt-3 pt-3 border-top"}>
      {!compact && <h6 className="mb-1"><i className={`ti ${copy.icon} me-2 text-primary`}></i>{copy.title}</h6>}
      {!compact && <div className="text-muted small mb-2" style={{ lineHeight: 1.3 }}>{copy.hint}</div>}

      {loading ? <div className="text-muted small">Loading…</div> : loadError ? (
        <div className="text-muted small mb-2"><i className="ti ti-lock me-1"></i>{loadError}</div>
      ) : items.length === 0 ? (
        <div className="text-muted small mb-2">{copy.empty}</div>
      ) : (
        <div className="d-flex flex-column gap-2 mb-3">
          {items.map((e) => (
            <div key={e.id} className="d-flex justify-content-between align-items-start rounded bg-light py-2 px-3 text-start">
              <div className="min-w-0">
                <span className="fw-semibold">{e.description}</span>
                {e.author && <span className="text-muted"> · {e.author}</span>}
                {e.quantity && <span className="text-muted"> · {e.quantity}</span>}
                {e.kept_at && <span className="text-muted"> · kept at {e.kept_at}</span>}
                {e.link_url && (
                  <div><a href={e.link_url} target="_blank" rel="noopener noreferrer" className="small text-break">
                    <i className="ti ti-external-link me-1"></i>{e.link_url}
                  </a></div>
                )}
              </div>
              {!readOnly && <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => remove(e.id)}><i className="ti ti-x"></i></button>}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="row g-2 align-items-end">
          <div className={isRef ? "col-md-4" : "col-md-11"}>
            <input className="form-control form-control-sm" placeholder={copy.subject} value={form.description} maxLength={500} onChange={set("description")} />
          </div>
          {isRef ? (
            <>
              <div className="col-md-3">
                <input className="form-control form-control-sm" placeholder="Author" value={form.author} maxLength={300} onChange={set("author")} />
              </div>
              <div className="col-md-4">
                <input className="form-control form-control-sm" placeholder="Link (https://…) - optional" value={form.link_url} maxLength={1000} onChange={set("link_url")} />
              </div>
            </>
          ) : null}
          <div className="col-md-1">
            <button type="button" className="btn btn-primary btn-sm w-100" onClick={add} disabled={saving || !form.description.trim()}>
              <i className="ti ti-plus"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysicalEnclosuresPanel;
