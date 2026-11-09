/**
 * Safe date-only display. Handles both bare date strings ("2026-05-27")
 * and full ISO datetimes ("2026-05-27T00:00:00"). Bare dates are treated
 * as local midnight to avoid UTC-offset day shifts.
 */
export function displayDate(dateStr) {
  if (!dateStr) return "—";
  const s = String(dateStr);
  const normalized = s.includes("T") || s.includes("Z") ? s : `${s}T00:00:00`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Date + time display. Accepts any parseable date/datetime string.
 */
export function displayDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
