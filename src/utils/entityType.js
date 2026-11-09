// Mirrors WorkflowsAPI's EntityDataResolver.IsDocumentEntityType exactly —
// entity_type is either the bare generic "DOCUMENT" fallback, or
// "DOCUMENT_" + a document type's code (e.g. "DOCUMENT_CONTRACTS"), per
// WorkflowsAPI/Migrations/AddDocumentEntityTypes.sql. Both forms mean "this
// is an EDMS document" and should be treated identically by the UI — only
// the entity_type STRING varies by document type, not the shape of the data
// EDMS returns for it.
export const isDocumentEntityType = (entityType) =>
    typeof entityType === "string" &&
    (entityType.toUpperCase() === "DOCUMENT" || entityType.toUpperCase().startsWith("DOCUMENT_"));
