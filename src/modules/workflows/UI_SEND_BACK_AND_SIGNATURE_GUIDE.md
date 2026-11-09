# UI Implementation Guide — Send Back & Signature Approval

Covers two new WorkflowsAPI approval features and the UsersAuthAPI signature endpoints
they depend on. All WorkflowsAPI JSON is snake_case; all endpoints require
`Authorization: Bearer <jwt>`.

---

## 1. Send Back With Comment

### 1.1 Concept

Instead of only APPROVE/REJECT, an approver acting on a pending step can now **send the
workflow back** to an earlier point in the chain with a mandatory comment. The target is
chosen by the approver:

- **`target_step_order = 0`** — send back to the **original submitter**. Every step is
  reset; once resubmitted, the workflow restarts from step 1.
- **`target_step_order = 1..N`** — send back to a **specific earlier approval step**.
  That step (and everything after it) is reopened; steps before it keep their existing
  `APPROVED` status untouched.

While sent back, the workflow instance sits in a paused `SENT_BACK` state. It does
**not** reappear in anyone's normal "pending approvals" list until someone explicitly
**resubmits** it (see 1.4). This is a two-step flow by design — there is no
single-call "send back and immediately reopen."

### 1.2 Where the "Send Back" action lives in the UI

On the same approval-action screen where APPROVE / REJECT / DELEGATE already live (the
step detail view, `GET /api/workflow-approvals/{workflowInstanceId}/steps/{stepOrder}`),
add a **"Send Back"** action alongside Approve/Reject. It should open a small form, not
fire immediately:

- **Target picker** — a dropdown/radio list built from the steps returned by
  `GET /api/workflow-approvals/{workflowInstanceId}/steps` (see 1.3), filtered to only
  steps with `step_order` **less than** the current step's `step_order`, plus a
  synthetic "Back to submitter" option representing `target_step_order = 0`. Label each
  step option with its `step_name`, e.g. "Step 1 — Finance Review".
- **Comment field** — required, plain text, matches the same field used for
  approve/reject comments. Block submission if empty (the API also enforces this with a
  400, but validate client-side first).
- **Submit → `POST /api/workflow-approvals/{stepApproverId}/send-back`**

Request body:
```json
{
  "comment": "Please double-check the amount",
  "target_step_order": 1
}
```

Success response (`200`):
```json
{ "success": true, "message": "Workflow sent back successfully" }
```

Error cases to surface to the user:
| Status | Body `message` | When |
|---|---|---|
| 400 | `target_step_order must be 0 (submitter) or a prior step's order less than the current step.` | Picker allowed an invalid value — shouldn't happen if the picker is built from 1.3's data, but handle defensively. |
| 400 | `Target step does not exist for this workflow instance.` | Stale data — refetch steps and retry. |
| 400 | `This approval has already been acted upon` | Someone else acted on this slot first — refresh the screen. |
| 404 | `Approval task not found or you don't have permission to act on it` | Stale/expired link. |

### 1.3 Rendering instance/step state with the new statuses

`GET /api/workflow-approvals/{workflowInstanceId}/steps` now returns two additional
status values you must handle in the step timeline UI:

- **Instance-level `status`**: add `"SENT_BACK"` to whatever set you already render
  (`PENDING`, `IN_PROGRESS`, `APPROVED`, `REJECTED`, `CANCELLED`). Suggested treatment:
  an amber/orange "Sent Back" badge, distinct from the red "Rejected" badge — this is
  not terminal, the workflow can still complete.
- **Step-level `status`**: add `"SENT_BACK"` (the step that's now the reopened resume
  point — while paused, this is the *target* step, not necessarily the step where the
  send-back was invoked) alongside existing `PENDING`/`APPROVED`/`REJECTED`/`SKIPPED`.
  Steps after the target additionally flip to `"SKIPPED"` — same status they'd get from
  a normal completion path, so no new rendering is needed there beyond what you already
  have for skipped steps.

Suggested step timeline treatment while `instance.status == "SENT_BACK"`:
```
Step 1 — Finance Review     [SENT_BACK]   ← "Awaiting resubmission" badge
Step 2 — Manager Approval   [SKIPPED]     ← greyed out, "Skipped (sent back)"
Step 3 — Director Sign-off  [SKIPPED]
```

If sent back to the submitter (`target_step_order = 0`), **all** steps show `SKIPPED`
and there is no step in `SENT_BACK` status — show a banner instead: *"This request was
sent back to the submitter for changes."*

The **submitter can now view the full instance** (steps + entity details) even though
they aren't an approver on any step — this was a required companion fix. Make sure any
"can I see this workflow" check in the frontend doesn't gate purely on "is this user an
approver"; the backend now also allows `started_by == current_user`.

### 1.4 Resubmit action

Show a **"Resubmit"** button when `instance.status === "SENT_BACK"`, but only to the
user(s) authorized to act on it:

- If the instance's pending target is the submitter (you won't get
  `sent_back_to_step_order` directly from the steps/entity-details response — infer
  "target = submitter" when **no step has status `SENT_BACK`** and instance status is
  `SENT_BACK`), show Resubmit only to `started_by`.
- Otherwise (some step has status `SENT_BACK`), show Resubmit to any user who is an
  approver of that specific step (same role-or-assignment logic you already use to
  decide whether someone can act on a normal pending step — reuse the `user_can_approve`
  / `can_act` flags already returned by the steps/step-detail endpoints).

Request:
```
POST /api/workflow-approvals/{workflowInstanceId}/resubmit
{ "comment": "Amount confirmed correct" }
```
(`comment` is optional here, unlike send-back.)

Success (`200`):
```json
{ "success": true, "message": "Workflow resubmitted successfully" }
```

Errors:
| Status | Body `message` |
|---|---|
| 400 | `Workflow is not in a sent-back state` — button shouldn't have been visible; refresh. |
| 403 | `Only the original submitter can resubmit this workflow` |
| 403 | `You are not an approver of the target step` |
| 404 | `Workflow instance not found` |

After a successful resubmit, refetch the steps — the target step (and everything after
it) returns to `PENDING`, `current_approvals = 0`, and any prior comment/signature on
those steps' approver rows is cleared (they're fresh tasks again). Steps before the
target keep their `APPROVED` status and are not re-shown as actionable.

### 1.5 History timeline

`GET /api/workflow-approvals/history/{workflowInstanceId}` now includes two new
optional fields on each row:

```json
{
  "id": "...",
  "workflow_instance_id": "...",
  "step_order": 2,
  "user_id": 42,
  "action": "SEND_BACK",
  "comment": "Please double-check the amount",
  "action_at": "2026-07-16T10:00:00Z",
  "signature_id": null,
  "target_step_order": 1
}
```

- `action` will now include `"SEND_BACK"` and `"RESUBMIT"` in addition to the existing
  `APPROVE`/`REJECT`/`DELEGATE` values — add icons/labels for these two.
- On a `SEND_BACK` row, `step_order` is the step **the sender was acting on**, and
  `target_step_order` is where they sent it. Render as: *"Sent back from Step
  {step_order} to {target_step_order == 0 ? 'Submitter' : 'Step ' + target_step_order}"*.
- On a `RESUBMIT` row, `step_order` is the step that was reopened; `target_step_order`
  is null (not needed — `step_order` already says it).
- `signature_id` is `null` on `SEND_BACK`/`RESUBMIT`/`REJECT`/`DELEGATE` rows — only
  populated on `APPROVE` rows where a signature was attached (see §2).

---

## 2. Signature on Approval

### 2.1 Concept

A user's e-signature (an uploaded image) is owned entirely by **UsersAuthAPI** — one
active signature per user, upload/replace like a profile picture. WorkflowsAPI never
stores the image; it only stores a `signature_id` reference on the approval action and
validates it server-side (exists, active, belongs to the acting user).

### 2.2 Signature management screen (User Profile / Settings)

Add a "My Signature" section, likely in account/profile settings:

- **`GET /api/users/{userId}/signature`** — fetch and display the current signature.
  ```json
  {
    "id": "b3f1...guid",
    "user_id": 42,
    "public_url": "https://apis.qbits.africa/IAmAPI/Signatures/user-42/sig_ab12.png",
    "mime_type": "image/png",
    "file_size_bytes": 15234,
    "is_active": true,
    "created_at": "2026-07-10T09:00:00Z"
  }
  ```
  `404 { "error": "No active signature found for this user." }` → show an empty state
  with an upload prompt instead of an image.

- **`POST /api/users/{userId}/signature`** — upload/replace. `multipart/form-data` with
  a single `file` field. Accepts `image/png`, `image/jpeg`, `image/svg+xml`; max size is
  server-configured (currently 2MB) — **fetch the limit from your own app config or just
  handle the 400 gracefully**, don't hardcode 2MB in the client since it can change.
  ```
  400 { "error": "File is required." }
  400 { "error": "Unsupported file type 'application/pdf'." }
  400 { "error": "File exceeds maximum size of 2MB." }
  ```
  On success (`200`), response is the same `SignatureResponseDTO` shape as GET — use it
  to immediately refresh the preview. Uploading automatically deactivates the previous
  signature (no separate "replace" step needed).

- **`DELETE /api/users/{userId}/signature`** — remove (soft-delete). `200 { "success":
  true, "message": "Signature removed." }` or `404 { "error": "No active signature to
  remove." }`.

Suggested UI: a canvas/upload widget showing the current signature image
(`public_url`) with "Replace" and "Remove" buttons, and an "Upload" state when none
exists.

### 2.3 Attaching a signature when approving

On the approve action (not reject, not send-back, not delegate), if the acting user has
a signature on file, offer a checkbox: **"Sign this approval with my signature"**,
showing a small preview of their signature image. Implementation:

1. When the approval screen loads, call `GET /api/users/{currentUserId}/signature`
   (UsersAuthAPI) to check if one exists. If `404`, don't show the checkbox (or show a
   "no signature on file" hint linking to the profile settings screen from 2.2).
2. If the user checks the box and hits Approve, include the signature's `id` in the
   existing approve request:
   ```json
   POST /api/workflow-approvals/{stepApproverId}/action
   { "action": "APPROVE", "comment": "Looks good", "signature_id": "b3f1...guid" }
   ```
3. `signature_id` is silently ignored if `action` is `"REJECT"` — don't bother sending
   it in that case.
4. Error to handle:
   ```
   400 { "message": "Invalid, inactive, or not-owned signature." }
   ```
   This shouldn't normally happen (the checkbox only appears when the current user has
   a valid signature), but can occur in a race (e.g. the user deleted their signature in
   another tab between page load and submit) — on this error, refetch the signature
   status and re-render the checkbox state.

### 2.4 Displaying a signature on an approved step

`GET /api/workflow-approvals/{workflowInstanceId}/steps/{stepOrder}` — each approver row
now includes:
```json
{
  "approver_id": "...",
  "user_id": 42,
  "status": "APPROVED",
  "action": "APPROVE",
  "comment": "Looks good",
  "acted_at": "2026-07-16T10:00:00Z",
  "signature_id": "b3f1...guid",
  "signed_at": "2026-07-16T10:00:00Z"
}
```

`signature_id`/`signed_at` are `null` when no signature was attached. To render the
actual signature **image** inline (e.g. on a document approval summary), call the step
detail endpoint with `?include_signature_details=true`:

```
GET /api/workflow-approvals/{workflowInstanceId}/steps/{stepOrder}?include_signature_details=true
```

This adds two extra fields per approver row when resolvable:
```json
{
  "...": "...",
  "signature_id": "b3f1...guid",
  "signed_at": "2026-07-16T10:00:00Z",
  "signature_public_url": "https://apis.qbits.africa/IAmAPI/Signatures/user-42/sig_ab12.png",
  "signature_mime_type": "image/png"
}
```
If the live lookup to UsersAuthAPI fails, `signature_public_url`/`signature_mime_type`
come back `null` even though `signature_id` is set — render a "signature on file"
placeholder/icon in that case rather than a broken image.

**Use `include_signature_details=true` sparingly** — only on views that actually render
the image (e.g. a document's final approval certificate/summary), not on list views or
the general step timeline, since it triggers a live cross-service call per signed
approver.

`GET /api/workflow-approvals/history/{workflowInstanceId}` also carries `signature_id`
per row (§1.5) but **not** a resolved URL — history is unbounded, so it's
reference-only. If you need to show a signature image from history, fetch it
individually via UsersAuthAPI:
```
GET /api/signatures/{signatureId}
```
which returns the same shape as `GET /api/users/{userId}/signature`.

### 2.5 Field/endpoint summary

| Concern | Service | Endpoint |
|---|---|---|
| View/upload/remove my signature | UsersAuthAPI | `GET / POST / DELETE /api/users/{id}/signature` |
| Look up any signature by id (e.g. rendering from history) | UsersAuthAPI | `GET /api/signatures/{signatureId}` |
| Attach signature on approve | WorkflowsAPI | `POST /api/workflow-approvals/{stepApproverId}/action` (`signature_id` field) |
| See signature reference on a step's approvers | WorkflowsAPI | `GET /api/workflow-approvals/{id}/steps/{stepOrder}` |
| See signature **image** on a step's approvers | WorkflowsAPI | `GET /api/workflow-approvals/{id}/steps/{stepOrder}?include_signature_details=true` |
| See signature reference in audit history | WorkflowsAPI | `GET /api/workflow-approvals/history/{id}` |

---

## 3. Quick Reference — New/Changed Endpoints

```
WorkflowsAPI
  POST   /api/workflow-approvals/{stepApproverId}/send-back      { comment, target_step_order }
  POST   /api/workflow-approvals/{workflowInstanceId}/resubmit   { comment? }
  POST   /api/workflow-approvals/{stepApproverId}/action         (+ optional signature_id, APPROVE only)
  GET    /api/workflow-approvals/{id}/steps                      (statuses now include SENT_BACK)
  GET    /api/workflow-approvals/{id}/steps/{stepOrder}          (+ signature_id/signed_at; ?include_signature_details=true)
  GET    /api/workflow-approvals/history/{id}                    (+ signature_id, target_step_order)

UsersAuthAPI
  POST   /api/users/{id}/signature      multipart file upload → replaces active signature
  GET    /api/users/{id}/signature      current active signature
  DELETE /api/users/{id}/signature      soft-delete active signature
  GET    /api/signatures/{signatureId}  lookup any signature by id
```
