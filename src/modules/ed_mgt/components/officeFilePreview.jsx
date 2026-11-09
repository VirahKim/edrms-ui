import React, { useState, useEffect, useRef } from "react";
import { MAX_SHEET_ROWS } from "./officeFileUtils";

// Shared docx/xlsx inline-preview rendering, used by both LocalFilePreview
// (a File the user just picked, not uploaded yet) and DocumentPreviewPanel
// (an already-uploaded document fetched by URL). Both just hand in a
// loadBuffer() that resolves to an ArrayBuffer plus a cacheKey to re-run on.

export const PreviewError = ({ message }) => (
  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
    <i className="ti ti-file-off" style={{ fontSize: 48 }}></i>
    <p className="mt-2 mb-0 text-center px-3">{message}</p>
  </div>
);

export const PreviewLoading = () => (
  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
    <div className="spinner-border spinner-border-sm me-2"></div> Rendering preview…
  </div>
);

/* ── Renders a .docx document's content via docx-preview ── */
export const DocxPreview = ({ loadBuffer, cacheKey }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    Promise.all([loadBuffer(), import("docx-preview")])
      .then(([buf, { renderAsync }]) => renderAsync(buf, containerRef.current, undefined, {
        inWrapper: false, ignoreWidth: true, ignoreHeight: true, className: "docx-preview",
      }))
      .then(() => { if (!cancelled) setStatus("ready"); })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  if (status === "error") return <PreviewError message="Couldn't render a preview for this document." />;
  return (
    <>
      {status === "loading" && <PreviewLoading />}
      <div ref={containerRef} className="h-100 w-100 bg-white p-3" style={{ overflow: "auto", display: status === "ready" ? "block" : "none" }} />
    </>
  );
};

/* ── Renders a .xlsx/.xls spreadsheet's active sheet as a table via SheetJS ── */
export const XlsxPreview = ({ loadBuffer, cacheKey }) => {
  const [xlsxMod, setXlsxMod] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setWorkbook(null);
    setActiveSheet(0);
    Promise.all([loadBuffer(), import("xlsx")])
      .then(([buf, mod]) => {
        if (cancelled) return;
        setXlsxMod(mod);
        setWorkbook(mod.read(buf, { type: "array" }));
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  if (status === "error") return <PreviewError message="Couldn't render a preview for this spreadsheet." />;
  if (status === "loading" || !workbook || !xlsxMod) return <PreviewLoading />;

  const sheetName = workbook.SheetNames[activeSheet];
  const rows = xlsxMod.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
  const truncated = rows.length > MAX_SHEET_ROWS;
  const visibleRows = truncated ? rows.slice(0, MAX_SHEET_ROWS) : rows;

  return (
    <div className="h-100 d-flex flex-column">
      {workbook.SheetNames.length > 1 && (
        <div className="d-flex gap-1 border-bottom px-2 py-1 flex-shrink-0" style={{ overflowX: "auto" }}>
          {workbook.SheetNames.map((name, i) => (
            <button key={name} type="button"
                    className={`btn btn-sm text-nowrap ${i === activeSheet ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setActiveSheet(i)}>
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-grow-1 bg-white" style={{ overflow: "auto" }}>
        <table className="table table-sm table-bordered mb-0" style={{ fontSize: "0.78rem" }}>
          <tbody>
            {visibleRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci} className="text-nowrap">{String(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {truncated && (
          <div className="text-muted text-center py-2" style={{ fontSize: "0.78rem" }}>
            Showing first {MAX_SHEET_ROWS} rows of {rows.length}.
          </div>
        )}
      </div>
    </div>
  );
};
