import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import {
  listLetterTemplates, addLetterTemplate, removeLetterTemplate, createLetterTemplate, listLetterTypes,
} from "../../../api/fileRoutingApi";

const TOKENS = [
  ["{{DATE}}", "today's date"],
  ["{{SUBJECT}}", "the letter's subject"],
  ["{{PARENT_REFERENCE}}", "the reference of the letter being answered"],
  ["{{PARENT_FOLIO}}", "the folio of the letter being answered"],
  ["{{FILE_REFERENCE}}", "the file's reference number"],
  ["{{OFFICER}}", "the name of whoever writes the letter"],
  ["{{OFFICER_TITLE}}", "their office, e.g. Marking Officer"],
  ["{{TO}}", "the addressee"],
  ["{{FROM}}", "who it is from (memos)"],
  ["{{CC}}", "copy to / distribution"],
  ["{{BODY}}", "where the text the officer writes goes"],
];

/**
 * Letter templates: Word files that already carry the logo, letterhead and layout. Officers start a new
 * reply from one; the {{TOKENS}} in it are filled in automatically.
 */
const LetterTemplatesPage = () => {
  const [templates, setTemplates] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const logoRef = useRef(null);
  const [types, setTypes] = useState([]);
  const [uploadType, setUploadType] = useState("");
  const [tab, setTab] = useState("create");          // create | upload
  const [made, setMade] = useState({ name: "", letter_type: "LETTER", organization_name: "", address_lines: "", footer_text: "", description: "" });
  const setMadeField = (k) => (e) => setMade((m) => ({ ...m, [k]: e.target.value }));

  const load = useCallback(() =>
    listLetterTemplates()
      .then((r) => setTemplates(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setTemplates([])), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { listLetterTypes().then((r) => setTypes(Array.isArray(r?.data) ? r.data : [])).catch(() => {}); }, []);

  // Make a template here: letterhead (logo, name, address), footer, and the layout of the kind of document.
  const create = async () => {
    if (!made.name.trim()) { toast.error("Give the template a name."); return; }
    const fd = new FormData();
    fd.append("name", made.name.trim());
    fd.append("description", made.description.trim());
    fd.append("letter_type", made.letter_type);
    fd.append("organization_name", made.organization_name.trim());
    fd.append("address_lines", made.address_lines);
    fd.append("footer_text", made.footer_text.trim());
    if (logoRef.current?.files?.[0]) fd.append("logo", logoRef.current.files[0]);
    setBusy(true);
    try {
      await createLetterTemplate(fd);
      toast.success("Template created.");
      setMade({ name: "", letter_type: made.letter_type, organization_name: made.organization_name, address_lines: made.address_lines, footer_text: made.footer_text, description: "" });
      if (logoRef.current) logoRef.current.value = "";
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not create the template.");
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const file = fileRef.current?.files?.[0];
    if (!name.trim()) { toast.error("Give the template a name."); return; }
    if (!file) { toast.error("Choose the Word (.docx) file."); return; }
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    if (uploadType) fd.append("letter_type", uploadType);
    fd.append("file", file);
    setBusy(true);
    try {
      await addLetterTemplate(fd);
      toast.success("Template added.");
      setName(""); setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not add the template.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try { await removeLetterTemplate(id); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || "Could not remove it."); }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="mb-3">
          <h5 className="fw-semibold mb-1">Letter Templates</h5>
          <div className="text-muted small">Word files with the logo and letterhead already in them. Officers start a reply letter from one.</div>
        </div>

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                {templates === null ? <div className="text-muted small">Loading…</div>
                  : templates.length === 0 ? <div className="text-muted small">No templates yet - officers get a plain blank letter until you add one.</div>
                  : templates.map((t) => (
                    <div key={t.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <div>
                        <div className="fw-semibold"><i className="ti ti-file-type-docx me-1 text-primary"></i>{t.name}</div>
                        <div className="text-muted small">
                          {t.letter_type && <span className="badge text-bg-light border me-1">{types.find((x) => x.code === t.letter_type)?.label || t.letter_type}</span>}
                          {[t.description, t.original_filename].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(t.id)}>Remove</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="btn-group btn-group-sm mb-2 w-100" role="group">
              <button type="button" className={`btn ${tab === "create" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("create")}>Create in the system</button>
              <button type="button" className={`btn ${tab === "upload" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("upload")}>Upload a Word file</button>
            </div>

            {tab === "create" && (
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  <div className="fw-semibold mb-1">Create a template</div>
                  <div className="text-muted small mb-2">
                    Pick the kind of document and fill in the letterhead. It gets the footer with page numbers, the places for the
                    text, the signature and the official stamp.
                  </div>
                  <select className="form-select form-select-sm mb-2" value={made.letter_type} onChange={setMadeField("letter_type")}>
                    {(types.length ? types : [{ code: "LETTER", label: "Official Letter" }]).map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </select>
                  <input className="form-control form-control-sm mb-2" placeholder="Template name, e.g. Official letter - Ministry of Health" maxLength={200}
                         value={made.name} onChange={setMadeField("name")} />
                  <input className="form-control form-control-sm mb-2" placeholder="Ministry / department name (printed under the logo)" maxLength={200}
                         value={made.organization_name} onChange={setMadeField("organization_name")} />
                  <textarea className="form-control form-control-sm mb-2" rows={3} placeholder={"Address lines, one per line\nP.O. Box 30016-00100, Nairobi\nTel: +254 20 ..."}
                            value={made.address_lines} onChange={setMadeField("address_lines")} />
                  <input className="form-control form-control-sm mb-2" placeholder="Footer text (optional)" maxLength={300}
                         value={made.footer_text} onChange={setMadeField("footer_text")} />
                  <label className="form-label small mb-1">Logo (PNG or JPG, optional)</label>
                  <input ref={logoRef} type="file" accept="image/png,image/jpeg" className="form-control form-control-sm mb-2" />
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={create}>
                    {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-wand me-1"></i>}Create template
                  </button>
                </div>
              </div>
            )}

            {tab === "upload" && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <div className="fw-semibold mb-2">Add a template</div>
                <select className="form-select form-select-sm mb-2" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="">For any kind of document</option>
                  {types.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
                <input className="form-control form-control-sm mb-2" placeholder="Name, e.g. Official letter - Ministry letterhead" maxLength={200}
                       value={name} onChange={(e) => setName(e.target.value)} />
                <input className="form-control form-control-sm mb-2" placeholder="Description (optional)" maxLength={500}
                       value={description} onChange={(e) => setDescription(e.target.value)} />
                <input ref={fileRef} type="file" accept=".docx" className="form-control form-control-sm mb-2" />
                <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={add}>
                  {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-upload me-1"></i>}Add template
                </button>
              </div>
            </div>
            )}

            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="fw-semibold mb-1">Fill-in fields</div>
                <div className="text-muted small mb-2">Type these into the Word file where they should appear:</div>
                {TOKENS.map(([token, what]) => (
                  <div key={token} className="small"><code>{token}</code> - {what}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LetterTemplatesPage;
