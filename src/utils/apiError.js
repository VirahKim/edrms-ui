/**
 * Extracts a human-readable error from an Axios error.
 *
 * FloatFlowAPI uses two error shapes:
 *   400 → { message, suggestion? }
 *   500 → { error, details? }
 *
 * Returns { title, detail } so callers can render both lines.
 */
export const getApiError = (err) => {
  const data = err?.response?.data;

  if (!data) {
    return {
      title: err?.message || 'An unexpected error occurred.',
      detail: null,
    };
  }

  // 400 shape
  if (data.message) {
    return {
      title: data.message,
      detail: data.suggestion || null,
    };
  }

  // 500 shape
  if (data.error) {
    return {
      title: data.error,
      detail: data.details || null,
    };
  }

  // Fallback — stringify whatever came back
  return {
    title: typeof data === 'string' ? data : 'An unexpected error occurred.',
    detail: null,
  };
};
