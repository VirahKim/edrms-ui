import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import {
  getLetterDraft, saveLetterDraft, previewLetterDraft, finishLetterDraft, listLetterTemplates, listLetterTypes,
} from "../../../api/fileRoutingApi";

// What a page starts with, so the officer is not facing a blank page.
const STARTERS = {
  LETTER: "<p>Dear Sir/Madam,</p><p></p><p></p>",
  FORWARDING: "<p>Dear Sir/Madam,</p><p>Please find attached the document referred to above, forwarded for your information and necessary action.</p><p></p>",
  MEMO: "<p></p>",
  SAVINGRAM: "<p></p>",
  CIRCULAR: "<p>All officers are informed that</p><p></p>",
  NOTICE: "<p></p>",
  MINUTES: "<h3>1. Apologies</h3><p></p><h3>2. Confirmation of the previous minutes</h3><p></p><h3>3. Matters arising</h3><p></p><h3>4. Resolutions</h3><p></p><h3>5. Any other business</h3><p></p><h3>6. Adjournment</h3><p></p>",
};

const AUTOSAVE_MS = 1500;

const Btn = ({ title, active, onClick, children, disabled }) => (
  <button type="button" title={title} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
          className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"} border-0`} style={{ minWidth: 32 }}>
    {children}
  </button>
);

/**
 * The letter writer: a word-processor panel inside the system. The officer picks the kind of document and its
 * template, writes the text, previews it on the template (letterhead, footer, signature and stamp sections),
 * and finishes it - the letter is then filed in the same file with the next folio number and
 * cross-referenced to the letter it answers. The text is saved as it is typed.
 *   routingId, draftId   the file routing and the draft being written
 *   onClose()            leave the writer (the draft is kept)
 *   onFiled(created)     the letter was finished and filed
 */
const LetterComposer = ({ routingId, draftId, onClose, onFiled }) => {
  const [draft, setDraft] = useState(null);
  const [types, setTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [fields, setFields] = useState({ subject: "", letter_type: "LETTER", template_id: "", addressee: "", from_text: "", copy_to: "" });
  const [mode, setMode] = useState("write");           // write | preview
  const [saveState, setSaveState] = useState("saved"); // saved | dirty | saving | error
  const [previewState, setPreviewState] = useState({ loading: false, error: "" });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);
  const timer = useRef(null);
  const latest = useRef({ fields, html: "" });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
    ],
    content: "",
    onUpdate: ({ editor: e }) => { latest.current.html = e.getHTML(); markDirty(); },
  });

  // ---- load the draft, the kinds of document and the templates
  useEffect(() => {
    let cancelled = false;
    Promise.all([getLetterDraft(routingId, draftId), listLetterTypes(), listLetterTemplates()])
      .then(([d, t, tpl]) => {
        if (cancelled) return;
        const dr = d?.data;
        setDraft(dr);
        setTypes(Array.isArray(t?.data) ? t.data : []);
        setTemplates(Array.isArray(tpl?.data) ? tpl.data : []);
        const f = {
          subject: dr.subject || "", letter_type: dr.letter_type || "LETTER", template_id: dr.template_id ? String(dr.template_id) : "",
          addressee: dr.addressee || "", from_text: dr.from_text || "", copy_to: dr.copy_to || "",
        };
        setFields(f);
        latest.current.fields = f;
        const html = dr.body_html && dr.body_html.trim() ? dr.body_html : (STARTERS[f.letter_type] || "");
        latest.current.html = html;
        if (editor) editor.commands.setContent(html, false);
      })
      .catch((e) => { toast.error(e?.response?.data?.message || "Could not open the letter."); onClose?.(); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routingId, draftId, editor]);

  // ---- saving
  const save = useCallback(async () => {
    clearTimeout(timer.current);
    setSaveState("saving");
    try {
      const f = latest.current.fields;
      await saveLetterDraft(routingId, draftId, {
        subject: f.subject, letter_type: f.letter_type, template_id: f.template_id ? Number(f.template_id) : null,
        addressee: f.addressee, from_text: f.from_text, copy_to: f.copy_to, body_html: latest.current.html,
      });
      setSaveState("saved");
      return true;
    } catch (e) {
      setSaveState("error");
      toast.error(e?.response?.data?.message || "Could not save the letter.");
      return false;
    }
  }, [routingId, draftId]);

  function markDirty() {
    setSaveState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_MS);
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  const setField = (key, value) => {
    setFields((f) => {
      const next = { ...f, [key]: value };
      // Changing the kind of document starts a fresh page if nothing has been written yet.
      latest.current.fields = next;
      return next;
    });
    markDirty();
  };

  const changeType = (code) => {
    const empty = !editor || editor.getText().trim().length === 0;
    setFields((f) => {
      // A template belongs to one kind of document; keep it only if it still fits.
      const keep = templates.find((t) => String(t.id) === f.template_id && (!t.letter_type || t.letter_type === code));
      const next = { ...f, letter_type: code, template_id: keep ? f.template_id : "" };
      latest.current.fields = next;
      return next;
    });
    if (empty && editor) { editor.commands.setContent(STARTERS[code] || "", false); latest.current.html = editor.getHTML(); }
    markDirty();
  };

  // ---- preview on the template
  const showPreview = async () => {
    if (!(await save())) return;
    setMode("preview");
    setPreviewState({ loading: true, error: "" });
    try {
      const buffer = await previewLetterDraft(routingId, draftId);
      const { renderAsync } = await import("docx-preview");
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        await renderAsync(buffer, previewRef.current, null, { inWrapper: true, ignoreLastRenderedPageBreak: true, breakPages: true });
      }
      setPreviewState({ loading: false, error: "" });
    } catch (e) {
      setPreviewState({ loading: false, error: "The preview could not be built. You can still finish the letter." });
    }
  };

  // ---- finish: file it
  const finish = async () => {
    setConfirming(false);
    if (!(await save())) return;
    setBusy(true);
    try {
      const res = await finishLetterDraft(routingId, draftId);
      toast.success(`Filed as folio ${res?.data?.folio_label}, and cross-referenced to the letter it answers.`);
      onFiled?.(res?.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not file the letter.");
    } finally {
      setBusy(false);
    }
  };

  const close = async () => { if (saveState === "dirty") await save(); onClose?.(); };

  const usableTemplates = templates.filter((t) => !t.letter_type || t.letter_type === fields.letter_type);
  const isMemoLike = ["MEMO", "SAVINGRAM", "CIRCULAR"].includes(fields.letter_type);
  const toLabel = fields.letter_type === "MINUTES" ? "Present / in attendance" : isMemoLike ? "To" : "Addressee";
  const kind = types.find((t) => t.code === fields.letter_type);

  const chain = editor?.chain().focus();
  const saveLabel = { saved: "All changes saved", dirty: "Unsaved changes…", saving: "Saving…", error: "Not saved - retry" }[saveState];

  return createPortal(
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.55)", zIndex: 9000 }}>
      <div className="modal-dialog modal-fullscreen">
        <div className="modal-content">
          {/* Title bar */}
          <div className="modal-header py-2 align-items-center">
            <div className="d-flex flex-column">
              <div className="fw-semibold"><i className="ti ti-writing me-2 text-primary"></i>Write a {kind?.label || "letter"}</div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                Answering: {draft?.parent_title}{draft?.parent_reference ? ` (${draft.parent_reference})` : ""}
              </div>
            </div>
            <div className="ms-auto d-flex align-items-center gap-2">
              <span className={`small ${saveState === "error" ? "text-danger" : "text-muted"}`}>{saveLabel}</span>
              <div className="btn-group btn-group-sm">
                <button type="button" className={`btn ${mode === "write" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode("write")}>
                  <i className="ti ti-pencil me-1"></i>Write
                </button>
                <button type="button" className={`btn ${mode === "preview" ? "btn-primary" : "btn-outline-primary"}`} onClick={showPreview}>
                  <i className="ti ti-eye me-1"></i>Preview on the template
                </button>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={save} disabled={saveState === "saving"}>
                <i className="ti ti-device-floppy me-1"></i>Save draft
              </button>
              <button type="button" className="btn btn-sm btn-success" onClick={() => setConfirming(true)} disabled={busy || !draft}>
                {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-check me-1"></i>}Finish and file
              </button>
              <button type="button" className="btn-close ms-1" onClick={close} aria-label="Close - the draft is kept" />
            </div>
          </div>

          <div className="modal-body p-0 d-flex" style={{ background: "#e9ecef", minHeight: 0 }}>
            {/* Details of the document */}
            <div className="p-3 border-end bg-white qb-scroll" style={{ width: 300, flex: "0 0 300px", overflowY: "auto" }}>
              <label className="form-label small fw-semibold mb-1">Kind of document</label>
              <select className="form-select form-select-sm mb-1" value={fields.letter_type} onChange={(e) => changeType(e.target.value)}>
                {(types.length ? types : [{ code: "LETTER", label: "Official Letter" }]).map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
              {kind?.description && <div className="form-text mb-2">{kind.description}</div>}

              <label className="form-label small fw-semibold mb-1">Template</label>
              <select className="form-select form-select-sm mb-1" value={fields.template_id} onChange={(e) => setField("template_id", e.target.value)}>
                <option value="">Plain layout (no logo)</option>
                {usableTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="form-text mb-2">The template carries the logo, letterhead, footer, signature and stamp sections.</div>

              <label className="form-label small fw-semibold mb-1">Subject</label>
              <input className="form-control form-control-sm mb-2" maxLength={500} value={fields.subject} onChange={(e) => setField("subject", e.target.value)} />

              <label className="form-label small fw-semibold mb-1">{toLabel}</label>
              <textarea className="form-control form-control-sm mb-2" rows={3} maxLength={500} value={fields.addressee} onChange={(e) => setField("addressee", e.target.value)}
                        placeholder={fields.letter_type === "LETTER" ? "The Director General\nMinistry of ...\nP.O. Box ..." : ""} />

              {["MEMO", "SAVINGRAM"].includes(fields.letter_type) && (
                <>
                  <label className="form-label small fw-semibold mb-1">From</label>
                  <input className="form-control form-control-sm mb-2" maxLength={500} value={fields.from_text} onChange={(e) => setField("from_text", e.target.value)}
                         placeholder="Left blank: your name and title" />
                </>
              )}

              <label className="form-label small fw-semibold mb-1">{fields.letter_type === "CIRCULAR" ? "Distribution" : "Copy to"}</label>
              <input className="form-control form-control-sm mb-3" maxLength={500} value={fields.copy_to} onChange={(e) => setField("copy_to", e.target.value)} />

              <div className="alert alert-light border small mb-0">
                <i className="ti ti-link me-1"></i>When you finish, the letter is filed in the file with the next folio number
                and cross-referenced to the letter it answers. Sign and stamp it from the file afterwards.
              </div>
            </div>

            {/* The page */}
            <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
              {mode === "write" ? (
                <>
                  <div className="bg-white border-bottom px-2 py-1 d-flex flex-wrap align-items-center gap-1">
                    <Btn title="Bold" active={editor?.isActive("bold")} onClick={() => chain.toggleBold().run()}><i className="ti ti-bold"></i></Btn>
                    <Btn title="Italic" active={editor?.isActive("italic")} onClick={() => chain.toggleItalic().run()}><i className="ti ti-italic"></i></Btn>
                    <Btn title="Underline" active={editor?.isActive("underline")} onClick={() => chain.toggleUnderline().run()}><i className="ti ti-underline"></i></Btn>
                    <span className="mx-1 text-muted">|</span>
                    <Btn title="Heading" active={editor?.isActive("heading", { level: 3 })} onClick={() => chain.toggleHeading({ level: 3 }).run()}><i className="ti ti-heading"></i></Btn>
                    <Btn title="Bullet list" active={editor?.isActive("bulletList")} onClick={() => chain.toggleBulletList().run()}><i className="ti ti-list"></i></Btn>
                    <Btn title="Numbered list" active={editor?.isActive("orderedList")} onClick={() => chain.toggleOrderedList().run()}><i className="ti ti-list-numbers"></i></Btn>
                    <Btn title="Quote" active={editor?.isActive("blockquote")} onClick={() => chain.toggleBlockquote().run()}><i className="ti ti-quote"></i></Btn>
                    <span className="mx-1 text-muted">|</span>
                    <Btn title="Align left" active={editor?.isActive({ textAlign: "left" })} onClick={() => chain.setTextAlign("left").run()}><i className="ti ti-align-left"></i></Btn>
                    <Btn title="Centre" active={editor?.isActive({ textAlign: "center" })} onClick={() => chain.setTextAlign("center").run()}><i className="ti ti-align-center"></i></Btn>
                    <Btn title="Align right" active={editor?.isActive({ textAlign: "right" })} onClick={() => chain.setTextAlign("right").run()}><i className="ti ti-align-right"></i></Btn>
                    <Btn title="Justify" active={editor?.isActive({ textAlign: "justify" })} onClick={() => chain.setTextAlign("justify").run()}><i className="ti ti-align-justified"></i></Btn>
                    <span className="mx-1 text-muted">|</span>
                    <Btn title="Insert a table" onClick={() => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><i className="ti ti-table"></i></Btn>
                    <Btn title="Add a row" disabled={!editor?.can().addRowAfter()} onClick={() => chain.addRowAfter().run()}><i className="ti ti-row-insert-bottom"></i></Btn>
                    <Btn title="Add a column" disabled={!editor?.can().addColumnAfter()} onClick={() => chain.addColumnAfter().run()}><i className="ti ti-column-insert-right"></i></Btn>
                    <Btn title="Delete the table" disabled={!editor?.can().deleteTable()} onClick={() => chain.deleteTable().run()}><i className="ti ti-table-off"></i></Btn>
                    <span className="mx-1 text-muted">|</span>
                    <Btn title="Undo" disabled={!editor?.can().undo()} onClick={() => chain.undo().run()}><i className="ti ti-arrow-back-up"></i></Btn>
                    <Btn title="Redo" disabled={!editor?.can().redo()} onClick={() => chain.redo().run()}><i className="ti ti-arrow-forward-up"></i></Btn>
                  </div>
                  <div className="flex-grow-1 qb-scroll" style={{ overflowY: "auto", padding: "24px 0" }}>
                    <div className="mx-auto bg-white shadow-sm" style={{ width: "min(794px, 96%)", minHeight: 900, padding: "28px 56px" }}>
                      <div className="text-center text-muted border-bottom pb-2 mb-3" style={{ fontSize: "0.72rem" }}>
                        <i className="ti ti-photo me-1"></i>Logo, letterhead, reference lines and subject come from the template - see them under "Preview on the template".
                      </div>
                      <EditorContent editor={editor} className="letter-editor" />
                      <div className="text-center text-muted border-top pt-2 mt-4" style={{ fontSize: "0.72rem" }}>
                        <i className="ti ti-signature me-1"></i>The signature and official stamp sections follow your text.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow-1 qb-scroll" style={{ overflow: "auto", padding: 16 }}>
                  {previewState.loading && <div className="text-center text-muted py-5"><span className="spinner-border spinner-border-sm me-2"></span>Building the preview…</div>}
                  {previewState.error && <div className="alert alert-warning">{previewState.error}</div>}
                  <div ref={previewRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .letter-editor .ProseMirror { outline: none; min-height: 640px; font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; }
        .letter-editor .ProseMirror p { margin: 0 0 0.6em; }
        .letter-editor .ProseMirror h3 { font-size: 13pt; font-weight: 700; margin: 0.8em 0 0.3em; }
        .letter-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
        .letter-editor .ProseMirror td, .letter-editor .ProseMirror th { border: 1px solid #888; padding: 4px 8px; vertical-align: top; min-width: 40px; }
        .letter-editor .ProseMirror th { background: #f1f3f5; font-weight: 700; }
        .letter-editor .ProseMirror blockquote { border-left: 3px solid #ccc; margin: 0.6em 0 0.6em 1em; padding-left: 0.8em; color: #444; }
        .letter-editor .ProseMirror ul, .letter-editor .ProseMirror ol { padding-left: 1.6em; margin-bottom: 0.6em; }
        .letter-editor .ProseMirror .selectedCell { background: #cfe2ff; }
      `}</style>

      <ConfirmModal
        show={confirming}
        title="Finish and file this letter?"
        message={`It will be filed in the same file next to the letter it answers${draft?.parent_reference ? ` (${draft.parent_reference})` : ""}, with its own folio, and cross-referenced to it. You can still sign and stamp it afterwards.`}
        confirmLabel="Yes, file it"
        onConfirm={finish}
        onCancel={() => setConfirming(false)}
      />
    </div>,
    document.body
  );
};

export default LetterComposer;
