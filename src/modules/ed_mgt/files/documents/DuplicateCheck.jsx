import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import { FieldLabel } from "../../components/Tooltip";
import { checkDuplicates } from "../../../../api/edmsApi";

const DuplicateCheck = () => {
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [checksum, setChecksum] = useState(searchParams.get("checksum") || "");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState(null);

  const runCheck = async () => {
    if (!title.trim() && !checksum.trim()) { toast.error("Enter a title or checksum to check."); return; }
    setLoading(true);
    try {
      const res = await checkDuplicates({ checksum: checksum.trim() || undefined, title: title.trim() || undefined });
      setResult(res?.data || res);
      setSearched(true);
    } catch { toast.error("Duplicate check failed."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (searchParams.get("title") || searchParams.get("checksum")) runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0"><i className="ti ti-copy me-2 text-primary"></i>Duplicate Check</h4>
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <p className="text-muted" style={{ fontSize: "0.85rem" }}>
              Documents are automatically checked for duplicate file checksums on upload. Use this tool to manually
              search by title or by a file's checksum before uploading, or to review a document already flagged.
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <FieldLabel label="Title" tooltip="Matches against existing document titles (contains-style match)." />
                <input className="form-control form-control-sm" value={title}
                  onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q1 Vendor Invoice" />
              </div>
              <div className="col-md-6">
                <FieldLabel label="File Checksum (SHA-256)" tooltip="The exact checksum of a file — an exact match means the same file was already uploaded somewhere else." />
                <input className="form-control form-control-sm" value={checksum}
                  onChange={(e) => setChecksum(e.target.value)} placeholder="Optional — paste a SHA-256 hash" />
              </div>
              <div className="col-12">
                <button className="btn btn-primary btn-sm" onClick={runCheck} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-1"></span>Checking…</> : <><i className="ti ti-search me-1"></i>Check for Duplicates</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {searched && !loading && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {result?.has_potential_duplicates && result?.matches?.length > 0 ? (
                <>
                  <div className="alert alert-warning py-2 d-flex align-items-center gap-2 mb-3">
                    <i className="ti ti-alert-triangle"></i>
                    {result.matches.length} possible duplicate{result.matches.length > 1 ? "s" : ""} found.
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead className="table-light"><tr><th>Document</th><th>Reference</th><th>Match Reason</th><th></th></tr></thead>
                      <tbody>
                        {result.matches.map((m) => (
                          <tr key={m.document_id}>
                            <td className="fw-semibold">{m.document_title}</td>
                            <td><code style={{ fontSize: "0.78rem" }}>{m.document_reference}</code></td>
                            <td><span className="badge bg-warning-subtle text-warning border">{m.match_reason}</span></td>
                            <td className="text-end">
                              <Link to={`/ed-mgt/documents/${m.document_id}`} className="btn btn-sm btn-outline-primary">
                                <i className="ti ti-eye me-1"></i>View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="ti ti-circle-check" style={{ fontSize: 48, color: "#007bff" }}></i>
                  <p className="mt-2 mb-0">No potential duplicates found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DuplicateCheck;
