// Utility to compute due date and payment term days
export function calculateDueDateAndDays(invoiceDateStr, term) {
  if (!invoiceDateStr) return { dueDate: invoiceDateStr, days: 0 };
  const inv = new Date(invoiceDateStr);
  let due = new Date(inv);

  if (term) {
    const netDays = Number(term.net_days) || 0;
    const grace = Number(term.grace_days) || 0;

    if (term.eom) {
      // end of invoice month
      const eom = new Date(inv.getFullYear(), inv.getMonth() + 1, 0);
      due = new Date(eom);
      // add net days after end of month
      due.setDate(due.getDate() + netDays + grace);
    } else {
      due = new Date(inv);
      due.setDate(due.getDate() + netDays + grace);
    }
  }

  const y = due.getFullYear();
  const m = String(due.getMonth() + 1).padStart(2, "0");
  const d = String(due.getDate()).padStart(2, "0");
  const daysDiff = Math.ceil((due - new Date(invoiceDateStr)) / (1000 * 60 * 60 * 24));

  return { dueDate: `${y}-${m}-${d}`, days: daysDiff };
}

export default calculateDueDateAndDays;
