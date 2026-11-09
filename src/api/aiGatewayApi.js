import axios from "axios";
import { getValidAccessToken } from "./apiClient";

// Enterprise AI Gateway — OpenAI-style routing layer in front of
// Google/OpenAI/Anthropic models. Separate axios instance from apiClient
// because it lives on its own host, but per API_GUIDE.md §2 it authenticates
// with the *same* bearer JWT as the rest of the app (the gateway decodes it
// itself and reads organization_id/user id claims) — there is no separate
// gateway API key.
const gatewayClient = axios.create({
  baseURL: import.meta.env.VITE_AI_GATEWAY_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

gatewayClient.interceptors.request.use(async (config) => {
  const token = await getValidAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const DEFAULT_POLICY = "erp-default";

/* ── Health ─────────────────────────────────────────────────
   No auth required (API_GUIDE.md §4.3). */
export const getGatewayHealth = () => gatewayClient.get("/v1/health").then((r) => r.data);

/* ── Models / routing policies ───────────────────────────────
   No auth required. Raw policy objects: { id, description, primary_model, fallback_chain } */
export const getModelPolicies = () =>
  gatewayClient.get("/v1/models").then((r) => r.data?.data || []);

/* ── Chat completions ─────────────────────────────────────── */
export const createChatCompletion = ({
  model = DEFAULT_POLICY,
  messages,
  temperature,
  maxTokens,
  stream = false,
  sessionId,
  gatewayPolicy,
}) => {
  const headers = {};
  if (sessionId) headers["X-Session-Id"] = sessionId;
  if (gatewayPolicy) headers["X-Gateway-Policy"] = gatewayPolicy;

  return gatewayClient
    .post(
      "/v1/chat/completions",
      {
        model,
        messages,
        stream,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      },
      Object.keys(headers).length ? { headers } : undefined
    )
    .then((r) => r.data);
};

// `history` is the prior [{role, content}, ...] turns already on screen;
// `message` is the new user turn. The gateway only remembers prior turns
// when a session id is supplied (API.md §"POST /v1/chat/completions") — in
// that case it prepends the stored history itself, so only the new turn
// should be sent. Without a session id it's stateless, so the full
// transcript is resent every time.
export const sendChatMessage = async (message, history = [], options = {}) => {
  const { model = DEFAULT_POLICY, temperature, maxTokens, sessionId, gatewayPolicy } = options;
  const messages = sessionId
    ? [{ role: "user", content: message }]
    : [...history.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: message }];

  const res = await createChatCompletion({ model, messages, temperature, maxTokens, sessionId, gatewayPolicy });
  const choice = res?.choices?.[0];

  return {
    reply: choice?.message?.content ?? "",
    model: res?.model,
    finishReason: choice?.finish_reason,
    usage: res?.usage,
    id: res?.id,
  };
};

/* ── Conversations ──────────────────────────────────────────
   Scoped server-side to the caller's own organization_id/user id — there
   is no tenant/user param to pass, and requesting another org's session_id
   just returns an empty message list rather than an error. */
export const getConversations = ({ limit = 50, offset = 0 } = {}) =>
  gatewayClient.get("/v1/conversations", { params: { limit, offset } }).then((r) => r.data?.data || []);

export const getConversationMessages = (sessionId, { limit = 100, offset = 0 } = {}) =>
  gatewayClient
    .get(`/v1/conversations/${encodeURIComponent(sessionId)}/messages`, { params: { limit, offset } })
    .then((r) => r.data?.data || []);

/* ── Budget ─────────────────────────────────────────────────
   Always the caller's own organization — it's read from the JWT
   server-side, so there is no tenant/org param to query anyone else's
   (API_GUIDE.md §4.4). Reports zeroes until per-org budgets are configured
   (API_GUIDE.md §8). */
export const getBudgetSummary = () => gatewayClient.get("/v1/budget").then((r) => r.data);

/* ── Error interpretation ──────────────────────────────────────
   Rate-limit and budget-exhausted errors both come back as a plain 429
   with no error.type/code field. The only way to tell them apart is the
   Retry-After header, which is only set on rate-limit responses
   (API_GUIDE.md §5). */
export const parseGatewayError = (err) => {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  const retryAfter = err?.response?.headers?.["retry-after"];

  if (status === 429) {
    if (retryAfter) return { kind: "rate_limit", detail, retryAfterSeconds: Number(retryAfter) };
    return { kind: "budget_exhausted", detail };
  }

  // 503 = every model in the policy's fallback chain failed (rate limited,
  // out of credits, misconfigured, etc). `detail` is a long multi-line log
  // of each attempt — surface it in full rather than discarding it.
  if (status === 503) {
    return { kind: "all_exhausted", detail };
  }

  return { kind: "error", detail: typeof detail === "string" ? detail : undefined };
};

export default gatewayClient;
