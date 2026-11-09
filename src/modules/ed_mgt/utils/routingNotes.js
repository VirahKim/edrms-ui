// Helpers for the routing notes composer (comment, signature, sticky notes).
// signed: the writer's signature is ready (set by the signature box under the comment).
export const emptyNotes = () => ({ comment: "", notes: [], signed: false });

/** 1 -> I, 2 -> II, 3 -> III ... the way comments are numbered on a file. */
export const toRoman = (num) => {
  let n = Number(num);
  if (!Number.isInteger(n) || n <= 0) return "";
  const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
};

/** Request fragment for a composer value: drops empty sticky notes. */
export const notesPayload = (value) => ({
  comment: value.comment.trim() || null,
  notes: value.notes
    .filter((n) => n.text.trim())
    .map((n) => ({
      kind: "STICKY_NOTE",
      text: n.text.trim(),
      visibility: n.visibility,
      document_id: n.document_id || null,
      pin_x: n.document_id && n.pin_x != null ? n.pin_x : null,
      pin_y: n.document_id && n.pin_y != null ? n.pin_y : null,
      recipient_user_ids: n.visibility === "PRIVATE" ? n.recipient_user_ids : [],
    })),
});

/**
 * What the user has typed but not sent yet, as it will look on the letter being previewed:
 * the comment, and sticky notes on this letter (or the whole file) that are not pinned - a
 * pinned one is drawn on the pin layer instead.
 *   lists   arrays of draft sticky notes (the step form, the quick add ...)
 */
export const draftNotesFor = (documentId, comment, lists = [], nextNumber = null) => [
  { text: comment, kind: "COMMENT", number: nextNumber },
  ...lists.flat()
    .filter((n) => n.text && n.text.trim() && n.pin_x == null && (n.document_id == null || n.document_id === documentId))
    .map((n) => ({ text: n.text, kind: "STICKY_NOTE" })),
];

/** Why a composer value cannot be sent, or null. */
export const notesProblem = (value, alsoWriting = false) => {
  // Only a comment is signed; sticky notes are not.
  const writing = alsoWriting || value.comment.trim();
  if (writing && !value.signed) return "Sign your comment first - load your saved signature or sign in the box under the comment.";
  const bad = value.notes.find((n) => n.text.trim() && n.visibility === "PRIVATE" && n.recipient_user_ids.length === 0);
  return bad ? "A private sticky note must be addressed to at least one person." : null;
};
