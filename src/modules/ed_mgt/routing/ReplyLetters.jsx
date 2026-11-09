import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import UserSelect from "../../communication/components/UserSelect";
import { toast } from "../components/EDMSToast";
import { connectExternalAccount, inviteToCloudEdit, updateDocument } from "../../../api/edmsApi";
import {
  listReplyLetters, createReplyLetter, uploadReplyLetter, listLetterTemplates,
  listLetterTypes, listLetterDrafts, startLetterDraft, deleteLetterDraft,
} from "../../../api/fileRoutingApi";
import LetterComposer from "./LetterComposer";

// What a new letter is called until the officer gives it its real subject.
const DEFAULT_TITLE = "Reply Letter";

const PROVIDERS = [
  { key: "GOOGLE", label: "Google Docs", icon: "ti-brand-google-drive" },
  { key: "MICROSOFT", label: "Microsoft Word online", icon: "ti-brand-windows" },
];

/**
 * Letters the officer writes in answer to the letters in this file. Each is filed in the same
 * file with its own next folio number (3, 4, 5 ...), cross-referenced to the letter it answers. Start one
 * from a template and write it online with others (they are emailed an invitation), or upload one
 * written in Word.
 *   letters  [{ id, title }] the letters a reply can be attached to
 */
const ReplyLetters = ({ routingId, letters, defaultParentId, readOnly = false }) => {
  const [list, setList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [parentId, setParentId] = useState(defaultParentId || letters[0]?.id || "");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [renaming, setRenaming] = useState(null);   // { id, title } of the letter being renamed
  const [templateId, setTemplateId] = useState("");
  const [mode, setMode] = useState("system");
  const [newKind, setNewKind] = useState("write");   // "write" a new letter or memo, or "upload" a document
  const [types, setTypes] = useState([]);
  const [letterType, setLetterType] = useState("LETTER");
  const [drafts, setDrafts] = useState([]);           // letters I am writing in the system, not yet filed
  const [composerId, setComposerId] = useState(null); // the draft open in the writer
  const [provider, setProvider] = useState("GOOGLE");
  const [collaborators, setCollaborators] = useState([]);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);       // what the last "create" returned
  const [inviting, setInviting] = useState(null);     // { letterId, sessionId } with the picker open
  const [inviteIds, setInviteIds] = useState([]);
  const fileRef = useRef(null);

  const reload = useCallback(() =>
    listReplyLetters(routingId)
      .then((r) => setList(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {}), [routingId]);

  const reloadDrafts = useCallback(() =>
    listLetterDrafts(routingId)
      .then((r) => setDrafts(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {}), [routingId]);

  useEffect(() => { reload(); reloadDrafts(); }, [reload, reloadDrafts]);
  useEffect(() => {
    listLetterTypes().then((r) => setTypes(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
    listLetterTemplates().then((r) => setTemplates(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
  }, []);
  useEffect(() => { if (defaultParentId) setParentId(defaultParentId); }, [defaultParentId]);

  const needParent = () => {
    if (!parentId) { toast.error("Choose the letter this one answers."); return false; }
    return true;
  };

  // Write it in the system: a draft is started and opened in the writer.
  const startWriting = async () => {
    if (!needParent()) return;
    const parent = letters.find((l) => String(l.id) === String(parentId));
    setBusy(true);
    try {
      const res = await startLetterDraft(routingId, {
        parent_document_id: Number(parentId),
        letter_type: letterType,
        template_id: templateId ? Number(templateId) : null,
        subject: title.trim() && title.trim() !== DEFAULT_TITLE ? title.trim() : (parent ? `RE: ${parent.title}` : null),
      });
      setComposerId(res?.data?.id);
      setTitle(DEFAULT_TITLE);
      await reloadDrafts();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not start the letter.");
    } finally {
      setBusy(false);
    }
  };

  const discardDraft = async (id) => {
    try { await deleteLetterDraft(routingId, id); await reloadDrafts(); }
    catch (e) { toast.error(e?.response?.data?.message || "Could not delete the draft."); }
  };

  const create = async () => {
    if (mode === "system") { await startWriting(); return; }
    if (!needParent()) return;
    if (!title.trim()) { toast.error("Give the letter a subject."); return; }
    setBusy(true);
    setOutcome(null);
    try {
      const res = await createReplyLetter(routingId, {
        parent_document_id: Number(parentId),
        title: title.trim(),
        template_id: templateId ? Number(templateId) : null,
        provider: mode === "online" ? provider : null,
        collaborator_user_ids: mode === "online" ? collaborators : [],
      });
      const created = res?.data;
      setOutcome(created);
      toast.success(`Filed as folio ${created?.folio_label}.`);
      setTitle(DEFAULT_TITLE); setCollaborators([]);
      if (created?.web_edit_url) window.open(created.web_edit_url, "_blank", "noopener,noreferrer");
      await reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not start the letter.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!needParent()) return;
    const fd = new FormData();
    fd.append("parent_document_id", String(parentId));
    fd.append("title", title.trim());
    fd.append("file", file);
    setBusy(true);
    try {
      const res = await uploadReplyLetter(routingId, fd);
      toast.success(`Filed as folio ${res?.data?.folio_label}.`);
      setTitle(DEFAULT_TITLE);
      await reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not upload the letter.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const connect = async (which) => {
    try {
      const res = await connectExternalAccount(which, "CLOUD_EDIT");
      const url = res?.data?.redirect_url;
      if (!url) { toast.error("Could not start the connection."); return; }
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Finish signing in in the new tab, then press Start again.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not start the connection.");
    }
  };

  const saveRename = async () => {
    const next = renaming?.title.trim();
    if (!next) return;
    setBusy(true);
    try {
      await updateDocument(renaming.id, { title: next });
      toast.success("Renamed.");
      setRenaming(null);
      await reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not rename the letter.");
    } finally {
      setBusy(false);
    }
  };

  const sendInvites = async () => {
    if (!inviting || inviteIds.length === 0) return;
    setBusy(true);
    try {
      const res = await inviteToCloudEdit(inviting.letterId, inviting.sessionId, { user_ids: inviteIds });
      const results = res?.data || [];
      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) toast.success("Invitations sent.");
      else toast.error(failed.map((f) => `${f.name || f.email}: ${f.error}`).join(" | "));
      setInviting(null); setInviteIds([]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not send the invitations.");
    } finally {
      setBusy(false);
    }
  };

  const parentSelect = (
    <select className="form-select form-select-sm" value={parentId} onChange={(e) => setParentId(e.target.value)}>
      <option value="">Choose the letter it answers…</option>
      {letters.map((l) => <option key={l.id} value={l.id}>{l.folio ? `Folio ${l.folio} - ` : ""}{l.title}</option>)}
    </select>
  );

  const templatesForType = templates.filter((t) => !t.letter_type || t.letter_type === letterType);

  return (
    <div>
      {composerId && (
        <LetterComposer
          routingId={routingId}
          draftId={composerId}
          onClose={() => { setComposerId(null); reloadDrafts(); }}
          onFiled={() => { setComposerId(null); reloadDrafts(); reload(); }}
        />
      )}

      {!readOnly && (
        <div className="mb-3">
          <div className="fw-semibold mb-2">New response</div>
          <div className="btn-group w-100 mb-3" role="tablist">
            <button type="button" role="tab" aria-selected={newKind === "write"} className={`btn btn-sm ${newKind === "write" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setNewKind("write")}>
              <i className="ti ti-file-plus me-1"></i>Write a new letter or memo
            </button>
            <button type="button" role="tab" aria-selected={newKind === "upload"} className={`btn btn-sm ${newKind === "upload" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setNewKind("upload")}>
              <i className="ti ti-upload me-1"></i>Upload a document
            </button>
          </div>
          {newKind === "write" ? (
            <>
      <div className="border rounded-3 p-3 mb-4">
        <div className="fw-semibold mb-2"><i className="ti ti-file-plus me-1 text-primary"></i>Start a new letter</div>
        <div className="mb-2">{parentSelect}</div>
        <input className="form-control form-control-sm mb-2" maxLength={500} placeholder="Subject of the letter"
               value={title} onChange={(e) => setTitle(e.target.value)} />
        {mode === "system" && (
          <select className="form-select form-select-sm mb-2" value={letterType} onChange={(e) => { setLetterType(e.target.value); setTemplateId(""); }}>
            {(types.length ? types : [{ code: "LETTER", label: "Official Letter" }]).map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        )}
        <select className="form-select form-select-sm mb-2" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">{mode === "system" ? "Plain layout (no logo)" : "Plain blank letter"}</option>
          {(mode === "system" ? templatesForType : templates).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="d-flex flex-wrap gap-3 mb-2 small">
          <label><input type="radio" className="form-check-input me-1" checked={mode === "system"} onChange={() => setMode("system")} />Write it here in the system</label>
          <label><input type="radio" className="form-check-input me-1" checked={mode === "online"} onChange={() => setMode("online")} />Write it online with others</label>
          <label><input type="radio" className="form-check-input me-1" checked={mode === "draft"} onChange={() => setMode("draft")} />File a draft only</label>
        </div>
        {mode === "system" && (
          <div className="text-muted small mb-2">
            A writing panel opens in the system - no Google or Microsoft account needed. When you finish, the letter is filed in the file with the next folio number
            and cross-referenced to the letter it answers.
          </div>
        )}

        {mode === "online" && (
          <>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {PROVIDERS.map((p) => (
                <button key={p.key} type="button" onClick={() => setProvider(p.key)}
                        className={`btn btn-sm ${provider === p.key ? "btn-primary" : "btn-outline-secondary"}`}>
                  <i className={`ti ${p.icon} me-1`}></i>{p.label}
                </button>
              ))}
            </div>
            <UserSelect isMulti value={collaborators} onChange={setCollaborators} placeholder="Invite people to write it with you (optional)…" />
          </>
        )}

        <button type="button" className="btn btn-primary btn-sm mt-2" disabled={busy} onClick={create}>
          {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-plus me-1"></i>}
          {mode === "system" ? "Start writing" : mode === "online" ? "Start writing online" : "File the draft"}
        </button>

        {outcome?.cloud_error && (
          <div className="alert alert-warning mt-2 mb-0 small">
            The letter is filed as folio {outcome.folio_label}, but the online session did not start: {outcome.cloud_error}
            <div className="mt-1 d-flex gap-1">
              {PROVIDERS.map((p) => (
                <button key={p.key} type="button" className="btn btn-sm btn-outline-primary" onClick={() => connect(p.key)}>
                  Connect {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {outcome?.invites?.length > 0 && (
          <div className="mt-2 small">
            {outcome.invites.map((i) => (
              <div key={`${i.user_id}`} className={i.ok ? "text-success" : "text-danger"}>
                <i className={`ti ${i.ok ? "ti-check" : "ti-x"} me-1`}></i>{i.name || i.email}: {i.ok ? "invited" : i.error}
              </div>
            ))}
          </div>
        )}
      </div>
            </>
          ) : (
            <>
      <div className="border rounded-3 p-3 mb-4">
        <div className="fw-semibold mb-1"><i className="ti ti-upload me-1 text-primary"></i>Upload a letter written in Word</div>
        <div className="text-muted small mb-2">It is filed with the next folio number and cross-referenced to the letter it answers.</div>
        <div className="mb-2">{parentSelect}</div>
        <input className="form-control form-control-sm mb-2" maxLength={500} placeholder="Subject of the document"
               value={title} onChange={(e) => setTitle(e.target.value)} />
        <input ref={fileRef} type="file" className="form-control form-control-sm" disabled={busy}
               accept=".doc,.docx,.pdf,.odt,.rtf" onChange={(e) => upload(e.target.files?.[0])} />
      </div>
            </>
          )}
        </div>
      )}

      {/* Letters being written in the system, not yet filed */}
      {drafts.length > 0 && (
        <div className="mb-3">
          <div className="fw-semibold mb-1"><i className="ti ti-writing me-1 text-warning"></i>My drafts</div>
          {drafts.map((d) => (
            <div key={d.id} className="border rounded p-2 mb-1 d-flex align-items-center justify-content-between gap-2 bg-warning bg-opacity-10">
              <div className="min-w-0">
                <div className="fw-semibold" style={{ fontSize: "0.86rem" }}>{d.subject}</div>
                <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                  {[types.find((t) => t.code === d.letter_type)?.label, d.parent_reference && `answers ${d.parent_reference}`, `saved ${new Date(d.updated_at).toLocaleString()}`].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setComposerId(d.id)}><i className="ti ti-pencil me-1"></i>Continue</button>
                <button type="button" className="btn btn-sm btn-outline-danger" title="Delete this draft" onClick={() => discardDraft(d.id)}><i className="ti ti-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Letters already written */}
      <div className="fw-semibold mb-1"><i className="ti ti-mail-forward me-1 text-primary"></i>Previous responses</div>
      {list.length === 0 ? (
        <div className="text-muted small mb-3">No responses yet. A response takes the next folio number in the file (for example 3, then 4) and is cross-referenced to the letter it answers.</div>
      ) : (
        <div className="mb-3">
          {list.map((l) => (
            <div key={l.id} className="border rounded p-2 mb-1">
              <div className="d-flex align-items-start justify-content-between gap-2">
                <div className="min-w-0">
                  <span className="badge text-bg-primary me-2">Folio {l.folio_label}</span>
                  {(() => {
                    const parent = letters.find((x) => x.id === l.attachment_of_document_id);
                    return parent?.folio ? <span className="text-muted small me-2" title="The letter this one answers">replies to Folio {parent.folio}</span> : null;
                  })()}
                  {renaming?.id === l.id ? (
                    <span className="d-inline-flex gap-1 align-middle">
                      <input className="form-control form-control-sm" style={{ minWidth: 220 }} maxLength={500} autoFocus value={renaming.title}
                             onChange={(e) => setRenaming({ id: l.id, title: e.target.value })}
                             onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }} />
                      <button type="button" className="btn btn-sm btn-primary" disabled={busy || !renaming.title.trim()} onClick={saveRename}>Save</button>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRenaming(null)}>Cancel</button>
                    </span>
                  ) : (
                    <>
                      <span className="fw-semibold" style={{ fontSize: "0.86rem" }}>{l.title}</span>
                      {!readOnly && (
                        <button type="button" className="btn btn-sm btn-link p-0 ms-2 text-muted" title="Rename this letter"
                                onClick={() => setRenaming({ id: l.id, title: l.title })}>
                          <i className="ti ti-pencil"></i>
                        </button>
                      )}
                    </>
                  )}
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                    {[l.status, l.created_by_name && `by ${l.created_by_name}`, new Date(l.created_at).toLocaleString()].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="d-flex flex-column gap-1 align-items-end">
                  <Link to={`/ed-mgt/documents/${l.id}`} className="btn btn-sm btn-outline-secondary" target="_blank">Open</Link>
                  {l.web_edit_url && (
                    <a href={l.web_edit_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-success">
                      <i className="ti ti-edit me-1"></i>Write online
                    </a>
                  )}
                </div>
              </div>
              {l.session_id && !readOnly && (
                <div className="mt-1">
                  {inviting?.letterId === l.id ? (
                    <div>
                      <UserSelect isMulti value={inviteIds} onChange={setInviteIds} placeholder="Invite people to write it with you…" />
                      <div className="mt-1 d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-primary" disabled={busy || inviteIds.length === 0} onClick={sendInvites}>Send invitations</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setInviting(null); setInviteIds([]); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-sm btn-link p-0" onClick={() => { setInviting({ letterId: l.id, sessionId: l.session_id }); setInviteIds([]); }}>
                      <i className="ti ti-user-plus me-1"></i>Invite more people
                    </button>
                  )}
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                    Being written online with {l.session_provider === "GOOGLE" ? "Google" : "Microsoft"}. When it is finished, open the letter and finish the online session to bring it back.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplyLetters;
