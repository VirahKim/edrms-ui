import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getMarkGrid, downloadMarkGridExcel } from "../../../api/recordsApi";
import { toast } from "../components/EDMSToast";

const errorOf = (err, fallback) => err?.response?.data?.message || fallback;
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

/**
 * Mark grid (Table 2) for one file: each movement of the file's documents, with the
 * folio, the officer to see it, that officer's initials, and when it was acknowledged.
 */
const MarkGridPage = () => {
  const { folderId } = useParams();
  const [result, setResult] = useState({ key: null, rows: [] });

  useEffect(() => {
    let cancelled = false;
    getMarkGrid(folderId)
      .then((res) => {
        if (!cancelled) setResult({ key: folderId, rows: Array.isArray(res?.data) ? res.data : res?.data?.data || [] });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorOf(err, "Could not load the file grid."));
        setResult({ key: folderId, rows: [] });
      });
    return () => { cancelled = true; };
  }, [folderId]);

  const loading = result.key !== folderId;
  const rows = loading ? [] : result.rows;

  const exportExcel = () => downloadMarkGridExcel(folderId)
    .catch((err) => toast.error(errorOf(err, "The Excel file could not be created.")));

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">File grid</h5>
            <div className="text-muted small"><Link to="/ed-mgt/records/files">Back to files</Link></div>
          </div>
          <button className="btn btn-sm btn-outline-success" onClick={exportExcel}>
            <i className="ti ti-file-spreadsheet me-1" />Download Excel
          </button>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {loading ? <div className="text-muted small">Loading…</div> : rows.length === 0 ? (
              <div className="text-muted small">Nothing has been marked on this file yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
                  <thead className="table-light">
                    <tr><th>Date</th><th>Folio</th><th>Document</th><th>Step</th><th>Officer to see</th><th>Initials</th><th>Acknowledged</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.document_id}-${i}`}>
                        <td>{fmt(r.date)}</td>
                        <td>{r.folio_number ?? "—"}</td>
                        <td>{r.document_title}</td>
                        <td>{r.step}</td>
                        <td>{r.officer_to_see}</td>
                        <td className="fw-semibold">{r.officer_initials}</td>
                        <td>{r.acknowledged_at ? fmt(r.acknowledged_at) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarkGridPage;
