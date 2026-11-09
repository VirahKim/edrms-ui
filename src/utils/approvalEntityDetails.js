import { getDocument, getFile } from "../api/edmsApi";
import { listFileRequests } from "../api/recordsApi";
import { isDocumentEntityType } from "./entityType";

// The approval kinds that are file requests, and what each does. Shared so that every list of pending
// approvals (My Queue, Workflows -> Pending) names them the same way.
export const FILE_REQUEST_VERBS = { FILE_OPENING: "Open file", FILE_CLOSING: "Close file", FILE_DISPOSAL: "Dispose file" };

export const isResolvableEntityType = (type) => isDocumentEntityType(type) || !!FILE_REQUEST_VERBS[type];

/**
 * Works out a readable label (and link, for documents) for each pending-approval row, so an approver can tell what
 * they are approving without opening it. Results go into setEntityDetailMap, keyed `${entity_type}:${entity_id}` -
 * entity_id is only unique within its own entity type.
 */
export const resolveApprovalEntityDetails = (items, setEntityDetailMap) => {
  const fileRequestItems = items.filter((i) => i.entity_id && FILE_REQUEST_VERBS[i.entity_type]);
  if (fileRequestItems.length) {
    // Name the file instead of "File opening request #8". entity_id is a file request id for requests, but the
    // FOLDER id when a file was created directly (it also runs the FILE_OPENING workflow), so match requests by
    // workflow instance and fall back to the folder.
    const setLabel = (item, name, ref) => {
      const key = `${item.entity_type}:${item.entity_id}`;
      const label = name ? `${FILE_REQUEST_VERBS[item.entity_type]}: ${ref ? `${ref} — ` : ""}${name}` : null;
      setEntityDetailMap((prev) => ({ ...prev, [key]: label ? { label } : null }));
    };
    listFileRequests()
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const byWorkflow = new Map(rows.filter((r) => r.workflow_instance_id)
          .map((r) => [r.workflow_instance_id.toLowerCase(), r]));
        fileRequestItems.forEach((item) => {
          // Pending rows carry workflow_instance_id; submission rows carry id.
          const r = byWorkflow.get(String(item.workflow_instance_id || item.id || "").toLowerCase());
          // With no file made yet, the reference is the one the approval gave (outcome_reference).
          if (r) { setLabel(item, r.file_subject || r.proposed_subject, r.file_reference || r.outcome_reference); return; }
          if (item.entity_type !== "FILE_OPENING") { setLabel(item, null); return; }
          getFile(item.entity_id)
            .then((f) => { const d = f?.data || f; setLabel(item, d?.name, d?.reference_no); })
            .catch(() => setLabel(item, null));
        });
      })
      .catch(() => fileRequestItems.forEach((item) => setLabel(item, null)));
  }

  items.forEach((item) => {
    if (!item.entity_id || !isDocumentEntityType(item.entity_type)) return;
    const key = `${item.entity_type}:${item.entity_id}`;
    getDocument(item.entity_id)
      .then((res) => {
        const doc = res?.data || res;
        setEntityDetailMap((prev) => ({
          ...prev,
          [key]: {
            label: doc?.title || doc?.document_reference || `Document #${item.entity_id}`,
            link: `/ed-mgt/documents/${item.entity_id}`,
            reference: doc?.document_reference,
            status: doc?.status,
          },
        }));
      })
      .catch(() => setEntityDetailMap((prev) => ({ ...prev, [key]: null })));
  });
};
