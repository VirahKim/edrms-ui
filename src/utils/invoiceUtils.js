/**
 * Invoice utilities for formatting and generating invoice numbers
 */

/**
 * Generates an invoice number based on the format pattern
 * @param {string} format - Format pattern (e.g., "INV-{PREFIX}{YEAR}{NUMBER}")
 * @param {string} prefix - Invoice number prefix
 * @param {number} sequenceNumber - Sequential number
 * @returns {string} Generated invoice number
 */
export const generateInvoiceNumber = (format, prefix = "", sequenceNumber = 0) => {
  if (!format) return `INV-${new Date().getFullYear()}-${sequenceNumber}`;

  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(6, "0");
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const date = String(new Date().getDate()).padStart(2, "0");

  let invoiceNumber = format
    .replace(/{PREFIX}/g, prefix || "INV")
    .replace(/{YEAR}/g, year)
    .replace(/{MONTH}/g, month)
    .replace(/{DATE}/g, date)
    .replace(/{NUMBER}/g, paddedNumber);

  return invoiceNumber;
};

/**
 * Formats a date for invoice display
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted date
 */
export const formatInvoiceDate = (date, locale = "en-US") => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Formats currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency
 */
export const formatInvoiceAmount = (amount = 0, currency = "USD", locale = "en-US") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Calculates payment status based on amounts
 * @param {number} invoiceTotal - Total invoice amount
 * @param {number} paidAmount - Amount paid
 * @returns {string} Payment status
 */
export const getPaymentStatus = (invoiceTotal, paidAmount) => {
  if (paidAmount === 0) return "Unpaid";
  if (paidAmount >= invoiceTotal) return "Paid";
  return "Partially Paid";
};

/**
 * Determines if invoice is overdue
 * @param {Date|string} dueDate - Due date
 * @returns {boolean} True if overdue
 */
export const isInvoiceOverdue = (dueDate) => {
  if (!dueDate) return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return due < new Date();
};

/**
 * Calculates days until due or days overdue
 * @param {Date|string} dueDate - Due date
 * @returns {number} Days (negative if overdue)
 */
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

/**
 * Validates invoice number format pattern
 * @param {string} format - Format pattern to validate
 * @returns {boolean} True if valid
 */
export const validateInvoiceFormat = (format) => {
  if (!format) return false;
  return /\{(PREFIX|YEAR|MONTH|DATE|NUMBER)\}/.test(format);
};

/**
 * Gets format examples for invoice number patterns
 * @returns {Array<{label: string, format: string, example: string}>} Format examples
 */
export const getInvoiceFormatExamples = () => [
  {
    label: "Simple Format",
    format: "INV-{PREFIX}{YEAR}{NUMBER}",
    example: "INV-INV2026000001",
  },
  {
    label: "Format with Date",
    format: "{PREFIX}-{YEAR}{MONTH}{DATE}-{NUMBER}",
    example: "INV-20260114-000001",
  },
  {
    label: "Custom Format",
    format: "{PREFIX}{YEAR}-{MONTH}-{NUMBER}",
    example: "INV2026-01-000001",
  },
  {
    label: "Detailed Format",
    format: "{PREFIX}/{YEAR}/{MONTH}/{NUMBER}",
    example: "INV/2026/01/000001",
  },
];

/**
 * Exports invoice data to PDF (requires backend support)
 * @param {object} invoiceData - Invoice data
 * @param {string} fileName - Output file name
 */
export const exportInvoiceToPDF = async (invoiceData, fileName = "invoice.pdf") => {
  try {
    const response = await fetch("/api/receivables/invoices/export/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) throw new Error("Failed to export PDF");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting invoice to PDF:", error);
    throw error;
  }
};

/**
 * Sends invoice via email (requires backend support)
 * @param {string} invoiceId - Invoice ID
 * @param {string} recipientEmail - Recipient email
 * @param {string} message - Optional message
 */
export const sendInvoiceViaEmail = async (invoiceId, recipientEmail, message = "") => {
  try {
    const response = await fetch(`/api/receivables/invoices/${invoiceId}/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        email: recipientEmail,
        message: message,
      }),
    });

    if (!response.ok) throw new Error("Failed to send invoice");

    return await response.json();
  } catch (error) {
    console.error("Error sending invoice via email:", error);
    throw error;
  }
};

export default {
  generateInvoiceNumber,
  formatInvoiceDate,
  formatInvoiceAmount,
  getPaymentStatus,
  isInvoiceOverdue,
  getDaysUntilDue,
  validateInvoiceFormat,
  getInvoiceFormatExamples,
  exportInvoiceToPDF,
  sendInvoiceViaEmail,
};
