import React, { useCallback, useEffect, useRef, useState } from "react";
import FileCover from "../components/FileCover";

const folioOf = (d) => (d.folio_label ?? d.folio_number) != null ? `Folio ${d.folio_label ?? d.folio_number}` : null;

/**
 * All the letters of a file one after another in a single scrolling pane, so reading on past the end
 * of one letter simply carries on into the next. Nothing is reloaded: the caller is told which letter
 * is at the top of the pane (onActiveChange) and shows its folio / subject; choosing a letter elsewhere
 * (activeId) scrolls the pane to it.
 *   renderLetter(doc, scrollRoot) draws one letter.
 *   coverFolderId: the file's cover is shown first, as the first page of the file.
 */
const ContinuousLetters = ({ docs, activeId, onActiveChange, height = 640, renderLetter, coverFolderId = null }) => {
  const [root, setRoot] = useState(null);
  const sections = useRef({});
  const detected = useRef(null);
  const frame = useRef(0);

  const detect = useCallback(() => {
    if (!root) return;
    const top = root.getBoundingClientRect().top + 60;
    let current = docs[0]?.id ?? null;
    for (const d of docs) {
      const el = sections.current[d.id];
      if (el && el.getBoundingClientRect().top <= top) current = d.id;
    }
    if (current !== detected.current) {
      detected.current = current;
      onActiveChange(current);
    }
  }, [root, docs, onActiveChange]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(detect);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // A letter picked from the list (or the one a note is being pinned on) is brought to the top.
  useEffect(() => {
    if (!root || activeId == null || activeId === detected.current) return;
    const el = sections.current[activeId];
    if (!el) return;
    detected.current = activeId;
    root.scrollTop += el.getBoundingClientRect().top - root.getBoundingClientRect().top;
  }, [activeId, root]);

  return (
    <div ref={setRoot} onScroll={onScroll}
         style={{ height, overflowY: "auto", position: "relative", background: "#525659", borderRadius: 4 }}>
      {coverFolderId && (
        <div style={{ padding: "18px 12px 6px" }}>
          <FileCover folderId={coverFolderId} size="page" />
        </div>
      )}
      {docs.map((d) => (
        <div key={d.id} ref={(el) => { if (el) sections.current[d.id] = el; else delete sections.current[d.id]; }}>
          <div className="px-3 py-1 text-truncate" style={{ position: "sticky", top: 0, zIndex: 12, background: "#3b3e41", color: "#e9ecef", fontSize: "0.72rem" }}>
            {[folioOf(d), d.title].filter(Boolean).join(" · ")}
          </div>
          {renderLetter(d, root)}
        </div>
      ))}
    </div>
  );
};

export default ContinuousLetters;
