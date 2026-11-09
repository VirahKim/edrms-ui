// Plain helpers shared by officeFilePreview.jsx and its consumers — kept out of that
// component file so react-refresh/only-export-components doesn't break fast refresh there.

export const MAX_SHEET_ROWS = 500; // cap rendering for very large spreadsheets

export const isDocxName = (name) => (name || "").toLowerCase().endsWith(".docx");

export const isXlsxName = (name) => {
  const n = (name || "").toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".xls");
};
