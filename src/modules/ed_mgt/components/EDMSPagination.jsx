import React from "react";

const EDMSPagination = ({ page, totalPages, totalCount, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50] }) => {
  if (!totalPages || totalPages <= 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end   = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
      <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.85rem" }}>
        <span>Showing {from}–{to} of {totalCount} results</span>
        <select className="form-select form-select-sm" style={{ width: "auto" }}
                value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {pageSizeOptions.map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>
              <i className="ti ti-chevron-left"></i>
            </button>
          </li>
          {start > 1 && (
            <>
              <li className="page-item"><button className="page-link" onClick={() => onPageChange(1)}>1</button></li>
              {start > 2 && <li className="page-item disabled"><span className="page-link">…</span></li>}
            </>
          )}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
            </li>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
              <li className="page-item"><button className="page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button></li>
            </>
          )}
          <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>
              <i className="ti ti-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default EDMSPagination;
