import apiClient from './apiClient';

const REPORTS_BASE = 'AssetsAPI/api/AssetReports';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a URL-encoded query string from an object, skipping null/undefined/empty values. */
const buildQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

/** Export report data as a CSV file. */
export const exportToCsv = (rows, filename = 'report.csv') => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] === null || row[h] === undefined ? '' : row[h];
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// ── Valuation Reports ──────────────────────────────────────────────────────

export const assetReportsApi = {
  /** POST /api/AssetReports/depreciation */
  getDepreciationReport: async (body) => {
    const response = await apiClient.post(`${REPORTS_BASE}/depreciation`, body);
    return response.data;
  },

  /** GET /api/AssetReports/valuation-summary */
  getValuationSummary: async (asAtDate) => {
    const response = await apiClient.get(`${REPORTS_BASE}/valuation-summary${buildQuery({ asAtDate })}`);
    return response.data;
  },

  /** GET /api/AssetReports/value-movement */
  getValueMovement: async (periodStart, periodEnd) => {
    const response = await apiClient.get(`${REPORTS_BASE}/value-movement${buildQuery({ periodStart, periodEnd })}`);
    return response.data;
  },

  /** GET /api/AssetReports/market-comparison */
  getMarketComparison: async (asAtDate, assetClass = '') => {
    const response = await apiClient.get(`${REPORTS_BASE}/market-comparison${buildQuery({ asAtDate, assetClass })}`);
    return response.data;
  },

  // ── Register Reports ───────────────────────────────────────────────────

  /** POST /api/AssetReports/asset-register */
  getAssetRegister: async (body) => {
    const response = await apiClient.post(`${REPORTS_BASE}/asset-register`, body);
    return response.data;
  },

  /** GET /api/AssetReports/asset-aging */
  getAssetAging: async (asAtDate, assetClass = '') => {
    const response = await apiClient.get(`${REPORTS_BASE}/asset-aging${buildQuery({ asAtDate, assetClass })}`);
    return response.data;
  },

  /** GET /api/AssetReports/category-summary */
  getCategorySummary: async (asAtDate) => {
    const response = await apiClient.get(`${REPORTS_BASE}/category-summary${buildQuery({ asAtDate })}`);
    return response.data;
  },

  // ── Location Reports ───────────────────────────────────────────────────

  /** GET /api/AssetReports/location */
  getLocationReport: async (locationId = '', includeSublocations = true) => {
    const response = await apiClient.get(`${REPORTS_BASE}/location${buildQuery({ locationId, includeSublocations })}`);
    return response.data;
  },

  /** GET /api/AssetReports/custodian */
  getCustodianReport: async (holderId = '') => {
    const response = await apiClient.get(`${REPORTS_BASE}/custodian${buildQuery({ holderId })}`);
    return response.data;
  },

  /** GET /api/AssetReports/transfers */
  getTransferReport: async (startDate, endDate, assetId = '') => {
    const response = await apiClient.get(`${REPORTS_BASE}/transfers${buildQuery({ startDate, endDate, assetId })}`);
    return response.data;
  },

  // ── Lifecycle Reports ──────────────────────────────────────────────────

  /** GET /api/AssetReports/acquisitions */
  getAcquisitionReport: async (startDate, endDate) => {
    const response = await apiClient.get(`${REPORTS_BASE}/acquisitions${buildQuery({ startDate, endDate })}`);
    return response.data;
  },

  /** GET /api/AssetReports/disposals */
  getDisposalReport: async (startDate, endDate, disposalType = '') => {
    const response = await apiClient.get(`${REPORTS_BASE}/disposals${buildQuery({ startDate, endDate, disposalType })}`);
    return response.data;
  },

  // ── Maintenance Reports ────────────────────────────────────────────────

  /** GET /api/AssetReports/maintenance-history */
  getMaintenanceHistory: async (startDate, endDate, assetId = '') => {
    const response = await apiClient.get(`${REPORTS_BASE}/maintenance-history${buildQuery({ startDate, endDate, assetId })}`);
    return response.data;
  },

  /** GET /api/AssetReports/maintenance-schedule */
  getMaintenanceSchedule: async (daysAhead = 90) => {
    const response = await apiClient.get(`${REPORTS_BASE}/maintenance-schedule${buildQuery({ daysAhead })}`);
    return response.data;
  },

  // ── Insurance & Warranty Reports ───────────────────────────────────────

  /** GET /api/AssetReports/insurance */
  getInsuranceCoverage: async (includeExpired = false) => {
    const response = await apiClient.get(`${REPORTS_BASE}/insurance${buildQuery({ includeExpired })}`);
    return response.data;
  },

  /** GET /api/AssetReports/warranty */
  getWarrantyStatus: async (includeExpired = false) => {
    const response = await apiClient.get(`${REPORTS_BASE}/warranty${buildQuery({ includeExpired })}`);
    return response.data;
  },

  // ── Compliance & Audit Reports ─────────────────────────────────────────

  /** GET /api/AssetReports/compliance */
  getComplianceReport: async () => {
    const response = await apiClient.get(`${REPORTS_BASE}/compliance`);
    return response.data;
  },

  /** GET /api/AssetReports/audit-trail/:assetId */
  getAuditTrail: async (assetId, startDate, endDate) => {
    const response = await apiClient.get(`${REPORTS_BASE}/audit-trail/${assetId}${buildQuery({ startDate, endDate })}`);
    return response.data;
  }
};
