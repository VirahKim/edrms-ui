import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getPreviewFile } from "../../../api/edmsApi";
import { FolioBox } from "./FolioBadge";
import { useFolioInfo } from "./useFolioInfo";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const PAGE_GAP = 8;

// One page, drawn only once it is near the screen so a long letter does not render everything up front.
const PdfPage = ({ pdf, number, width, root, folio }) => {
  const holderRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState(null);        // { w, h } at the current width
  const [near, setNear] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pdf.getPage(number).then((page) => {
      if (cancelled || !width) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      setSize({ w: width, h: Math.round(base.height * scale), scale });
    });
    return () => { cancelled = true; };
  }, [pdf, number, width]);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { root: root || null, rootMargin: "800px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [root]);

  useEffect(() => {
    if (!near || !size) return undefined;
    let cancelled = false;
    let task = null;
    pdf.getPage(number).then((page) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: size.scale * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      task.promise.catch(() => {});
    });
    return () => { cancelled = true; if (task) task.cancel(); };
  }, [near, size, pdf, number]);

  return (
    <div ref={holderRef} style={{ position: "relative", width: "100%", height: size?.h ?? 600, marginBottom: PAGE_GAP, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
      <FolioBox info={folio} style={{ position: "absolute", top: 8, right: 10, zIndex: 3 }} />
      {near && size && <canvas ref={canvasRef} style={{ width: size.w, height: size.h, display: "block" }} />}
    </div>
  );
};

/**
 * A letter drawn page after page at its natural height, with no scroll box of its own, so several
 * letters can sit one under another in a single scrolling pane. `root` is that scrolling pane
 * (used to draw pages only when they come near the screen).
 */
const PdfPages = ({ documentId, versionId, root }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState({ key: null, pdf: null, imageUrl: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const key = `${documentId}:${versionId}:${attempt}`;
  const folio = useFolioInfo(documentId);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!documentId || !versionId) return undefined;
    let cancelled = false;
    let url = null;
    let loaded = null;
    getPreviewFile(documentId, versionId)
      .then(async (blob) => {
        if (cancelled) return;
        if (blob.type.startsWith("image/")) {
          url = URL.createObjectURL(blob);
          setState({ key, pdf: null, imageUrl: url, error: null });
          return;
        }
        loaded = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        const pdf = await loaded.promise;
        if (!cancelled) setState({ key, pdf, imageUrl: null, error: null });
      })
      .catch(() => { if (!cancelled) setState({ key, pdf: null, imageUrl: null, error: "Could not load preview." }); });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      if (loaded) loaded.destroy();
    };
  }, [documentId, versionId, attempt, key]);

  const current = state.key === key ? state : null;

  return (
    <div ref={wrapRef} style={{ width: "100%", background: "#525659", padding: PAGE_GAP, boxSizing: "border-box" }}>
      {!current ? (
        <div className="d-flex align-items-center justify-content-center text-white-50" style={{ height: 200 }}>
          <div className="spinner-border spinner-border-sm me-2"></div> Loading letter…
        </div>
      ) : current.error ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-white-50" style={{ height: 200 }}>
          <i className="ti ti-file-off" style={{ fontSize: 40 }}></i>
          <div className="mt-1">Preview not available</div>
          <button className="btn btn-sm btn-light mt-2" onClick={() => setAttempt((n) => n + 1)}>
            <i className="ti ti-refresh me-1"></i>Retry
          </button>
        </div>
      ) : current.imageUrl ? (
        <div style={{ position: "relative" }}>
          <FolioBox info={folio} style={{ position: "absolute", top: 8, right: 10, zIndex: 3 }} />
          <img src={current.imageUrl} alt="Letter" style={{ width: "100%", display: "block", background: "#fff" }} />
        </div>
      ) : (
        Array.from({ length: current.pdf.numPages }, (_, i) => (
          <PdfPage key={i + 1} pdf={current.pdf} number={i + 1} width={Math.max(0, width - PAGE_GAP * 2)} root={root} folio={folio} />
        ))
      )}
    </div>
  );
};

export default PdfPages;
