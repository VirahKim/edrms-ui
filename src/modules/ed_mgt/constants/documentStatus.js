// Mirrors DocumentsController.SubmittableStatuses (EDmsAPI) — statuses a
// document can be (re)submitted for approval from. LANDING is the normal
// first-submission state; RETURNED_FOR_REWORK and REJECTED are both "an
// approver sent this back — fix it and resubmit" states; DRAFT covers a
// document saved before ever being submitted; SUBMIT_FAILED covers a submit
// call that errored out server-side (e.g. workflow start failed) and needs
// retrying. ACTIVE is different from the rest — it's already been approved,
// but the business now allows starting a brand-new approval round from it
// (a "resubmission"), so it's included here too; isResubmission() lets
// callers tell that case apart from a normal first-time submit. Anything
// else already mid-workflow, already finalized some other way, or
// administratively frozen (locked/legal hold/archived) is deliberately
// excluded — the backend enforces this regardless, but checking it here too
// means the UI doesn't offer an action that can only fail.
export const SUBMITTABLE_STATUSES = ["LANDING", "DRAFT", "RETURNED_FOR_REWORK", "REJECTED", "SUBMIT_FAILED", "ACTIVE"];

export const isSubmittableStatus = (status) => SUBMITTABLE_STATUSES.includes(status);

// ACTIVE is the one submittable status that isn't a "first submission" —
// the document is already approved, so submitting from here starts a new
// approval round rather than the initial one. Callers use this to swap
// copy ("Resubmit" vs "Submit") and show the "already approved" banner.
export const isResubmission = (status) => status === "ACTIVE";
