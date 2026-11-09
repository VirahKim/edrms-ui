// Client-side log of AI gateway errors surfaced in the chat UI. Kept out of
// the end-user chat (which only ever shows a short, friendly message) and
// read by the admin-only error log viewer instead.
const STORAGE_KEY = "ai_gateway_error_logs";
const MAX_LOGS = 100;

const read = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (logs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // best-effort logging — storage unavailable/full shouldn't break the chat
  }
};

export const getErrorLogs = () => read();

export const addErrorLog = ({ kind, message, detail, policy }) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    kind,
    message,
    detail,
    policy,
  };
  write([entry, ...read()].slice(0, MAX_LOGS));
  return entry;
};

export const removeErrorLog = (id) => write(read().filter((l) => l.id !== id));

export const clearErrorLogs = () => write([]);
