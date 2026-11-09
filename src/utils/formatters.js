// Date formatting
export const formatDate = (
  date,
  format = "yyyy-MM-dd",
  locale = "en-US"
) => {
  if (!date) return "-";

  const d = new Date(date);
  if (isNaN(d)) return "-";

  const optionsMap = {
    "yyyy-MM-dd": { year: "numeric", month: "2-digit", day: "2-digit" },
    "dd/MM/yyyy": { day: "2-digit", month: "2-digit", year: "numeric" },
    "MMM dd, yyyy": { day: "2-digit", month: "short", year: "numeric" },
    "MMMM dd, yyyy": { day: "2-digit", month: "long", year: "numeric" },
    "yyyy-MM-dd HH:mm": {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  };

  const options = optionsMap[format] || optionsMap["yyyy-MM-dd"];

  return new Intl.DateTimeFormat(locale, options).format(d);
};

// Currency formatting
export const formatCurrency = (
  amount,
  currency = "KES",
  locale = "en-KE"
) => {
  if (amount === null || amount === undefined) return "-";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Plain number formatting
export const formatNumber = (
  value,
  locale = "en-KE",
  { minimumFractionDigits = 0, maximumFractionDigits = 2 } = {}
) => {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (isNaN(num)) return "-";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(num);
};

// Percentage formatting
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (isNaN(num)) return "-";

  return `${num.toFixed(decimals)}%`;
};

// Score formatting
export const formatScore = (value, decimals = 1) => {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (isNaN(num)) return "-";

  return num.toFixed(decimals);
};

// Status text + class
export const getStatusMeta = (status) => {
  if (!status) {
    return { text: "Unknown", bg: "bg-secondary" };
  }

  const normalized = status.toLowerCase();

  const statusMap = {
    pending: { text: "PENDING", bg: "bg-warning" },
    approved: { text: "APPROVED", bg: "bg-success" },
    rejected: { text: "REJECTED", bg: "bg-danger" },
    paid: { text: "PAID", bg: "bg-primary" },
    cancelled: { text: "CANCELLED", bg: "bg-dark" }
  };

  return statusMap[normalized] || {
    text: status,
    bg: "bg-secondary"
  };
};

export const getStatusBg = (status) => {
  if (!status) {
    return "bg-secondary";
  }

  const normalized = status.toLowerCase();

  const statusMap = {
    pending: { text: "PENDING", bg: "bg-warning" },
    approved: { text: "APPROVED", bg: "bg-success" },
    rejected: { text: "REJECTED", bg: "bg-danger" },
    paid: { text: "PAID", bg: "bg-primary" },
    cancelled: { text: "CANCELLED", bg: "bg-dark" }
  };

  return statusMap[normalized].bg || "bg-secondary";
};

export const getStatusColor = (status) => {
  if (typeof status !== "string") {
    return "text-secondary";
  }

  const normalized = status.trim().toLowerCase();

  const statusMap = {
    pending: { text: "PENDING", color: "text-warning" },
    approved: { text: "APPROVED", color: "text-success" },
    rejected: { text: "REJECTED", color: "text-danger" },
    paid: { text: "PAID", color: "text-primary" },
    cancelled: { text: "CANCELLED", color: "text-dark" }
  };

  return statusMap[normalized]?.color ?? "text-secondary";
};