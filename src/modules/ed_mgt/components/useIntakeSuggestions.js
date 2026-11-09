import { useEffect, useRef, useState } from "react";
import { getOCRJob } from "../../../api/edmsApi";
import { mapOcrSuggestions } from "../utils/inwardIntake";

const POLL_MS = 4000;
const MAX_POLLS = 60; // ~4 minutes, then we stop quietly — the user just keeps typing

/**
 * Follows the OCR jobs that import queued, in the background.
 * jobIds: array of OCR job ids (falsy entries are ignored — e.g. a Word file has no OCR job).
 * Returns { [jobId]: { state: "running" | "ready" | "failed", suggestions } }.
 * "ready" with an empty `suggestions` means OCR finished but found nothing usable.
 */
export default function useIntakeSuggestions(jobIds) {
  const [byJob, setByJob] = useState({});
  const doneRef = useRef(new Set());
  const pollsRef = useRef(0);
  const key = (jobIds || []).filter(Boolean).join(",");

  useEffect(() => {
    const ids = key ? key.split(",").map(Number) : [];
    if (ids.length === 0) return undefined;
    let cancelled = false;
    let timer;

    const tick = async () => {
      const pending = ids.filter((id) => !doneRef.current.has(id));
      if (pending.length === 0 || pollsRef.current++ >= MAX_POLLS) return;
      const results = await Promise.all(pending.map(async (id) => {
        try {
          const res = await getOCRJob(id);
          return [id, res?.data ?? res];
        } catch { return [id, null]; }
      }));
      if (cancelled) return;
      setByJob((prev) => {
        const next = { ...prev };
        results.forEach(([id, job]) => {
          if (!job) return;
          if (job.status === "QUEUED" || job.status === "PROCESSING") {
            next[id] = { state: "running", suggestions: {} };
          } else if (job.status === "FAILED" || job.status === "CANCELLED" || job.status === "REJECTED") {
            doneRef.current.add(id);
            next[id] = { state: "failed", suggestions: {} };
          } else {
            doneRef.current.add(id);
            next[id] = { state: "ready", suggestions: mapOcrSuggestions(job.extracted_fields) };
          }
        });
        return next;
      });
      timer = setTimeout(tick, POLL_MS);
    };

    tick();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [key]);

  return byJob;
}
