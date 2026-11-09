import apiClient from './apiClient';

const ASSETS_BASE = 'AssetsAPI/api/Assets';
const ASSET_ACCOUNTING_BASE = 'AssetsAPI/api/AssetAccounting';
const CATEGORIES_BASE = 'AssetsAPI/api/AssetCategories';
const LOCATIONS_BASE = 'AssetsAPI/api/AssetLocations';
const VENDORS_BASE = 'AssetsAPI/api/AssetVendors';
const ACQUISITIONS_BASE = 'AssetsAPI/api/AssetAcquisitions';
const TRANSFERS_BASE = 'AssetsAPI/api/AssetTransfers';
const MAINTENANCE_BASE = 'AssetsAPI/api/AssetMaintenance';
const DISPOSALS_BASE = 'AssetsAPI/api/AssetDisposals';
const WARRANTIES_BASE = 'AssetsAPI/api/AssetWarranties';
const INSURANCES_BASE = 'AssetsAPI/api/AssetInsurances';
const TELEMETRY_BASE = 'AssetsAPI/api/AssetTelemetry';
const ASSET_TYPES_BASE = 'AssetsAPI/api/AssetTypes';
const PORTFOLIOS_BASE = 'AssetsAPI/api/AssetPortfolios';
const FIXED_ASSETS_BASE = 'AssetsAPI/api/FixedAssets';
const FINANCIAL_ASSETS_BASE = 'AssetsAPI/api/FinancialAssets';
const INTANGIBLE_ASSETS_BASE = 'AssetsAPI/api/IntangibleAssets';
const ROU_ASSETS_BASE = 'AssetsAPI/api/RightOfUseAssets';
const VALUATIONS_BASE = 'AssetsAPI/api/AssetValuations';
const VALUATION_METHODS_BASE = 'AssetsAPI/api/AssetsValuationMethods';

// Asset Categories API
export const assetCategoriesApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeInactive) queryParams.append('includeInactive', params.includeInactive);
    if (params.assetClass) queryParams.append('assetClass', params.assetClass);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${CATEGORIES_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${CATEGORIES_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(CATEGORIES_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${CATEGORIES_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${CATEGORIES_BASE}/${id}`);
    return response.data;
  }
};

// Asset Locations API
export const assetLocationsApi = {
  getAll: async (includeInactive = false) => {
    const response = await apiClient.get(`${LOCATIONS_BASE}?includeInactive=${includeInactive}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${LOCATIONS_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(LOCATIONS_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${LOCATIONS_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${LOCATIONS_BASE}/${id}`);
    return response.data;
  }
};

// Asset Vendors API
export const assetVendorsApi = {
  getAll: async (includeInactive = false) => {
    const response = await apiClient.get(`${VENDORS_BASE}?includeInactive=${includeInactive}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${VENDORS_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(VENDORS_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${VENDORS_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${VENDORS_BASE}/${id}`);
    return response.data;
  }
};

// Assets API
export const assetsApi = {
  getSummary: async () => {
    const response = await apiClient.get(`${ASSETS_BASE}/summary`);
    return response.data;
  },

  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.locationId) queryParams.append('locationId', params.locationId);
    if (params.assetClass) queryParams.append('assetClass', params.assetClass);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${ASSETS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${ASSETS_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(ASSETS_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${ASSETS_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${ASSETS_BASE}/${id}`);
    return response.data;
  },

  revalue: async (id, data) => {
    const response = await apiClient.post(`${ASSETS_BASE}/${id}/revalue`, data);
    return response.data;
  },

  batchRevalue: async (data) => {
    const response = await apiClient.post(`${ASSETS_BASE}/batch-revalue`, data);
    return response.data;
  },

  getValueHistory: async (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.valueType) queryParams.append('valueType', params.valueType);
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${ASSETS_BASE}/${id}/value-history${queryString ? '?' + queryString : ''}`);
    return response.data;
  }
};

// Asset Acquisitions API
export const assetAcquisitionsApi = {
  getAll: async (status = null) => {
    const url = status ? `${ACQUISITIONS_BASE}?status=${status}` : ACQUISITIONS_BASE;
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${ACQUISITIONS_BASE}/${id}`);
    return response.data;
  },
  
  getItems: async (id) => {
    const response = await apiClient.get(`${ACQUISITIONS_BASE}/${id}/items`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(ACQUISITIONS_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${ACQUISITIONS_BASE}/${id}`, data);
    return response.data;
  },
  
  submit: async (id) => {
    const response = await apiClient.post(`${ACQUISITIONS_BASE}/${id}/submit`);
    return response.data;
  },
  
  approve: async (id) => {
    const response = await apiClient.post(`${ACQUISITIONS_BASE}/${id}/approve`);
    return response.data;
  },
  
  reject: async (id) => {
    const response = await apiClient.post(`${ACQUISITIONS_BASE}/${id}/reject`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${ACQUISITIONS_BASE}/${id}`);
    return response.data;
  }
};

// Asset Transfers API
export const assetTransfersApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.assetId) queryParams.append('assetId', params.assetId);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${TRANSFERS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${TRANSFERS_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(TRANSFERS_BASE, data);
    return response.data;
  },
  
  approve: async (id, data) => {
    const response = await apiClient.post(`${TRANSFERS_BASE}/${id}/approve`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${TRANSFERS_BASE}/${id}`);
    return response.data;
  }
};

// Asset Maintenance API
export const assetMaintenanceApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.assetId) queryParams.append('assetId', params.assetId);
    if (params.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${MAINTENANCE_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${MAINTENANCE_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(MAINTENANCE_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${MAINTENANCE_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${MAINTENANCE_BASE}/${id}`);
    return response.data;
  }
};

// Asset Disposals API
export const assetDisposalsApi = {
  getAll: async (assetId = null) => {
    const url = assetId ? `${DISPOSALS_BASE}?assetId=${assetId}` : DISPOSALS_BASE;
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${DISPOSALS_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(DISPOSALS_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${DISPOSALS_BASE}/${id}`, data);
    return response.data;
  },
  
  approve: async (id, data) => {
    const response = await apiClient.post(`${DISPOSALS_BASE}/${id}/approve`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${DISPOSALS_BASE}/${id}`);
    return response.data;
  }
};

// Asset Warranties API
export const assetWarrantiesApi = {
  getAll: async (assetId = null) => {
    const url = assetId ? `${WARRANTIES_BASE}?assetId=${assetId}` : WARRANTIES_BASE;
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${WARRANTIES_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(WARRANTIES_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${WARRANTIES_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${WARRANTIES_BASE}/${id}`);
    return response.data;
  }
};

// Asset Insurances API
export const assetInsurancesApi = {
  getAll: async (assetId = null) => {
    const url = assetId ? `${INSURANCES_BASE}?assetId=${assetId}` : INSURANCES_BASE;
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`${INSURANCES_BASE}/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(INSURANCES_BASE, data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`${INSURANCES_BASE}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`${INSURANCES_BASE}/${id}`);
    return response.data;
  }
};

// Asset Telemetry API
export const assetTelemetryApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.assetId) queryParams.append('assetId', params.assetId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${TELEMETRY_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },
  
  getLatest: async (assetId) => {
    const response = await apiClient.get(`${TELEMETRY_BASE}/latest/${assetId}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post(TELEMETRY_BASE, data);
    return response.data;
  },
  
  createBatch: async (data) => {
    const response = await apiClient.post(`${TELEMETRY_BASE}/batch`, data);
    return response.data;
  },

  getByAsset: async (assetId, dateRange) => {
    const queryParams = new URLSearchParams();
    if (dateRange.start_date) queryParams.append('start_date', dateRange.start_date);
    if (dateRange.end_date) queryParams.append('end_date', dateRange.end_date);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${TELEMETRY_BASE}?assetId=${assetId}${queryString ? '&' + queryString : ''}`);
    return response.data;
  }
};

// Constants for dropdowns and validation
export const ASSET_STATUS = ['Active', 'InMaintenance', 'Disposed', 'Retired', 'Sold', 'Matured', 'Expired'];
export const ASSET_CONDITION = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];
export const ASSET_CLASSES = ['Fixed', 'Financial', 'Intangible', 'RightOfUse'];
export const DEPRECIATION_METHODS = ['SL', 'DB', 'UoP'];
export const MAINTENANCE_TYPES = ['Preventive', 'Corrective', 'Emergency', 'Inspection'];
export const MAINTENANCE_STATUS = ['Scheduled', 'InProgress', 'Done', 'Cancelled'];
export const DISPOSAL_METHODS = ['Sale', 'Scrap', 'Donation', 'Trade-in', 'Auction'];
export const ACQUISITION_STATUS = ['Draft', 'Submitted', 'Approved', 'Rejected'];
export const TRANSFER_STATUS = ['Pending', 'Approved', 'Completed', 'Cancelled'];
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
export const FINANCIAL_ASSET_TYPES = ['Bond', 'Stock', 'MutualFund', 'ETF', 'TreasuryBill', 'CommercialPaper', 'Debenture'];
export const INTEREST_PAYMENT_FREQUENCIES = ['Monthly', 'Quarterly', 'SemiAnnual', 'Annual'];
export const INTANGIBLE_TYPES = ['Patent', 'Trademark', 'Copyright', 'License', 'Goodwill', 'Franchise', 'CustomerList', 'BrandName', 'SoftwareLicense'];
export const LEASE_TYPES = ['Finance', 'Operating'];
export const PAYMENT_FREQUENCIES = ['Monthly', 'Quarterly', 'Annual'];
export const VALUATION_METHODS = ['MarketValue', 'BookValue', 'Appraisal', 'DCF', 'NAV', 'FairValue', 'ReplacementCost'];
export const CALCULATION_TYPES = [
  'StraightLine',
  'DecliningBalance',
  'DoubleDecliningBalance',
  'SumOfYearsDigits',
  'UnitsOfProduction',
  'IFRS16',
  'MarketBased',
  'Manual',
  'None',
];
export const VALUE_CHANGE_DIRECTIONS = ['Decrease', 'Increase', 'Variable', 'None'];
export const PORTFOLIO_TYPES = ['Equity', 'FixedIncome', 'Mixed', 'MoneyMarket', 'Alternative'];

// Asset Types API
export const assetTypesApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeInactive !== undefined) queryParams.append('includeInactive', params.includeInactive);
    if (params.assetClass) queryParams.append('assetClass', params.assetClass);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${ASSET_TYPES_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getByCategory: async (categoryId) => {
    const response = await apiClient.get(`${ASSET_TYPES_BASE}/by-category/${categoryId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${ASSET_TYPES_BASE}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(ASSET_TYPES_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${ASSET_TYPES_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${ASSET_TYPES_BASE}/${id}`);
    return response.data;
  }
};

// Asset Portfolios API
export const assetPortfoliosApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeInactive !== undefined) queryParams.append('includeInactive', params.includeInactive);
    if (params.portfolioType) queryParams.append('portfolioType', params.portfolioType);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${PORTFOLIOS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${PORTFOLIOS_BASE}/${id}`);
    return response.data;
  },

  getAssets: async (id) => {
    const response = await apiClient.get(`${PORTFOLIOS_BASE}/${id}/assets`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(PORTFOLIOS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${PORTFOLIOS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${PORTFOLIOS_BASE}/${id}`);
    return response.data;
  }
};

// Fixed Assets API
export const fixedAssetsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.locationId) queryParams.append('locationId', params.locationId);
    if (params.condition) queryParams.append('condition', params.condition);
    if (params.hasIoTDevice !== undefined) queryParams.append('hasIoTDevice', params.hasIoTDevice);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/${id}`);
    return response.data;
  },

  getByAssetId: async (assetId) => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/by-asset/${assetId}`);
    return response.data;
  },

  getByLocation: async (locationId) => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/by-location/${locationId}`);
    return response.data;
  },

  getTrackable: async () => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/trackable`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(FIXED_ASSETS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${FIXED_ASSETS_BASE}/${id}`, data);
    return response.data;
  },

  updateLocation: async (id, newLocationId) => {
    const response = await apiClient.patch(`${FIXED_ASSETS_BASE}/${id}/location`, newLocationId);
    return response.data;
  },

  updateIoTDevice: async (id, deviceId) => {
    const response = await apiClient.patch(`${FIXED_ASSETS_BASE}/${id}/iot-device`, deviceId);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${FIXED_ASSETS_BASE}/${id}`);
    return response.data;
  }
};

// Fixed Asset QR Code API
export const fixedAssetQrApi = {
  getActive: async (fixedAssetId) => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/${fixedAssetId}/qr`);
    return response.data;
  },

  generate: async (fixedAssetId, dto) => {
    const response = await apiClient.post(`${FIXED_ASSETS_BASE}/${fixedAssetId}/qr/generate`, dto);
    return response.data;
  },

  downloadImage: async (fixedAssetId) => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/${fixedAssetId}/qr/image`, { responseType: 'blob' });
    return response.data;
  },

  getHistory: async (fixedAssetId) => {
    const response = await apiClient.get(`${FIXED_ASSETS_BASE}/${fixedAssetId}/qr/history`);
    return response.data;
  },

  revoke: async (fixedAssetId, qrCodeId) => {
    const response = await apiClient.delete(`${FIXED_ASSETS_BASE}/${fixedAssetId}/qr/${qrCodeId}/revoke`);
    return response.data;
  }
};

// Financial Assets API
export const financialAssetsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.financialAssetType) queryParams.append('financialAssetType', params.financialAssetType);
    if (params.portfolioId) queryParams.append('portfolioId', params.portfolioId);
    if (params.maturityBefore) queryParams.append('maturityBefore', params.maturityBefore);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${FINANCIAL_ASSETS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${FINANCIAL_ASSETS_BASE}/${id}`);
    return response.data;
  },

  getByAssetId: async (assetId) => {
    const response = await apiClient.get(`${FINANCIAL_ASSETS_BASE}/by-asset/${assetId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(FINANCIAL_ASSETS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${FINANCIAL_ASSETS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${FINANCIAL_ASSETS_BASE}/${id}`);
    return response.data;
  }
};

// Intangible Assets API
export const intangibleAssetsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.intangibleType) queryParams.append('intangibleType', params.intangibleType);
    if (params.expiringWithin90Days !== undefined) queryParams.append('expiringWithin90Days', params.expiringWithin90Days);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${INTANGIBLE_ASSETS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${INTANGIBLE_ASSETS_BASE}/${id}`);
    return response.data;
  },

  getByAssetId: async (assetId) => {
    const response = await apiClient.get(`${INTANGIBLE_ASSETS_BASE}/by-asset/${assetId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(INTANGIBLE_ASSETS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${INTANGIBLE_ASSETS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${INTANGIBLE_ASSETS_BASE}/${id}`);
    return response.data;
  }
};

// Right-of-Use Assets API
export const rouAssetsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.leaseType) queryParams.append('leaseType', params.leaseType);
    if (params.expiringWithin90Days !== undefined) queryParams.append('expiringWithin90Days', params.expiringWithin90Days);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${ROU_ASSETS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${ROU_ASSETS_BASE}/${id}`);
    return response.data;
  },

  getByAssetId: async (assetId) => {
    const response = await apiClient.get(`${ROU_ASSETS_BASE}/by-asset/${assetId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(ROU_ASSETS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${ROU_ASSETS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${ROU_ASSETS_BASE}/${id}`);
    return response.data;
  }
};

// Asset Valuations API
export const assetValuationsApi = {
  // --- Valuation Records (Appraisals) ---
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.assetId) queryParams.append('assetId', params.assetId);
    if (params.valuationMethod) queryParams.append('valuationMethod', params.valuationMethod);
    if (params.officialOnly !== undefined) queryParams.append('officialOnly', params.officialOnly);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${VALUATIONS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${VALUATIONS_BASE}/${id}`);
    return response.data;
  },

  getLatest: async (assetId) => {
    const response = await apiClient.get(`${VALUATIONS_BASE}/latest/${assetId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(VALUATIONS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${VALUATIONS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${VALUATIONS_BASE}/${id}`);
    return response.data;
  },

  // --- Depreciation / Amortisation Operations ---
  runDepreciation: async (data) => {
    const response = await apiClient.post(`${VALUATIONS_BASE}/depreciation/run`, data);
    return response.data;
  },

  batchDepreciation: async (data) => {
    const response = await apiClient.post(`${VALUATIONS_BASE}/depreciation/batch`, data);
    return response.data;
  },

  // --- Market Value Updates ---
  updateMarketValue: async (data) => {
    const response = await apiClient.post(`${VALUATIONS_BASE}/market-value`, data);
    return response.data;
  },

  batchMarketValue: async (data) => {
    const response = await apiClient.post(`${VALUATIONS_BASE}/market-value/batch`, data);
    return response.data;
  },

  // --- Batch Depreciation Posting to GL ---
  postBatchDepreciation: async (data) => {
    const response = await apiClient.post(`${VALUATIONS_BASE}/depreciation/batch`, data);
    return response.data;
  },

  // --- Value Schedules ---
  generateSchedule: async (data) => {
    const response = await apiClient.post(`${VALUATIONS_BASE}/schedule`, data);
    return response.data;
  },

  getSchedule: async (assetId) => {
    const response = await apiClient.get(`${VALUATIONS_BASE}/schedule/${assetId}`);
    return response.data;
  }
};

// Valuation Methods API (reference data)
export const valuationMethodsApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.includeInactive !== undefined) queryParams.append('includeInactive', params.includeInactive);
    if (params.assetClass) queryParams.append('assetClass', params.assetClass);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${VALUATION_METHODS_BASE}${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${VALUATION_METHODS_BASE}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(VALUATION_METHODS_BASE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`${VALUATION_METHODS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${VALUATION_METHODS_BASE}/${id}`);
    return response.data;
  }
};

// Asset Accounting Integration API
export const assetAccountingApi = {
  // Account Mappings
  getMappings: async (assetClass = null) => {
    const url = assetClass
      ? `${ASSET_ACCOUNTING_BASE}/mappings?asset_class=${assetClass}`
      : `${ASSET_ACCOUNTING_BASE}/mappings`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getMappingById: async (id) => {
    const response = await apiClient.get(`${ASSET_ACCOUNTING_BASE}/mappings/${id}`);
    return response.data;
  },

  createMapping: async (data) => {
    const response = await apiClient.post(`${ASSET_ACCOUNTING_BASE}/mappings`, data);
    return response.data;
  },

  updateMapping: async (id, data) => {
    const response = await apiClient.put(`${ASSET_ACCOUNTING_BASE}/mappings/${id}`, data);
    return response.data;
  },

  deleteMapping: async (id) => {
    const response = await apiClient.delete(`${ASSET_ACCOUNTING_BASE}/mappings/${id}`);
    return response.data;
  },

  // GL Transactions
  getTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.asset_id) queryParams.append('asset_id', params.asset_id);
    if (params.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const response = await apiClient.get(
      `${ASSET_ACCOUNTING_BASE}/transactions${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  },

  getFailedTransactions: async () => {
    const response = await apiClient.get(`${ASSET_ACCOUNTING_BASE}/transactions/failed`);
    return response.data;
  },

  // Batch Operations
  postBatchDepreciation: async (data) => {
    const response = await apiClient.post(`${ASSET_ACCOUNTING_BASE}/depreciation/batch`, data);
    return response.data;
  },

  postAcquisition: async (assetId) => {
    const response = await apiClient.post(`${ASSET_ACCOUNTING_BASE}/acquisition/${assetId}`);
    return response.data;
  },

  // Chart of Accounts proxy
  getAccounts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.q) queryParams.append('q', params.q);
    const queryString = queryParams.toString();
    const response = await apiClient.get(
      `${ASSET_ACCOUNTING_BASE}/accounts${queryString ? '?' + queryString : ''}`
    );
    return response.data;
  }
};

export const GL_TRANSACTION_STATUSES = ['Pending', 'Posted', 'Failed', 'Reversed'];
export const GL_TRANSACTION_TYPES = ['Acquisition', 'Depreciation', 'Disposal', 'Revaluation', 'Transfer', 'Impairment'];

// Asset Stewards API
export const assetStewardsApi = {
  getStewards: async (assetId) => {
    const response = await apiClient.get(`${ASSETS_BASE}/${assetId}/stewards`);
    return response.data;
  },

  getEmployeeAssets: async (employeeId) => {
    const response = await apiClient.get(`${ASSETS_BASE}/employees/${employeeId}/assets`);
    return response.data;
  },

  assignSteward: async (assetId, data) => {
    const response = await apiClient.post(`${ASSETS_BASE}/${assetId}/stewards`, data);
    return response.data;
  },

  batchAssignStewards: async (assetId, stewards) => {
    const response = await apiClient.post(`${ASSETS_BASE}/${assetId}/stewards/batch`, { stewards });
    return response.data;
  },

  updateSteward: async (stewardId, data) => {
    const response = await apiClient.put(`${ASSETS_BASE}/stewards/${stewardId}`, data);
    return response.data;
  },

  setPrimarySteward: async (assetId, employeeId) => {
    const response = await apiClient.put(`${ASSETS_BASE}/${assetId}/stewards/primary/${employeeId}`);
    return response.data;
  },

  removeSteward: async (stewardId) => {
    const response = await apiClient.delete(`${ASSETS_BASE}/stewards/${stewardId}`);
    return response.data;
  },

  getEmployees: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${ASSETS_BASE}/employees${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getEmployeeSummaries: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    const queryString = queryParams.toString();
    const response = await apiClient.get(`${ASSETS_BASE}/employees/summary${queryString ? '?' + queryString : ''}`);
    return response.data;
  }
};
