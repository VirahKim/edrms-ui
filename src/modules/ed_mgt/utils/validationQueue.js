// A short-lived, sessionStorage-backed queue of document ids still needing a
// validation pass after a multi-document ingestion (Bulk Upload / Import from
// Email). DocumentValidation.jsx reads this to offer "next document" /
// "skip the rest" instead of dropping the user back at the Landing Queue
// after every single document. Session-scoped (not persisted across tabs or
// after the browser closes) — it's just a hand-off for the current visit,
// not a durable to-do list; Landing Queue itself remains the durable one.
const KEY = "edms_validation_queue";

// ids: array of newly created document ids, in the order they should be
// validated. A queue of 0 or 1 isn't a queue — nothing to page through.
export function setValidationQueue(ids) {
  if (!Array.isArray(ids) || ids.length <= 1) {
    clearValidationQueue();
    return;
  }
  sessionStorage.setItem(KEY, JSON.stringify(ids));
}

export function getValidationQueue() {
  try {
    const raw = sessionStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function clearValidationQueue() {
  sessionStorage.removeItem(KEY);
}
