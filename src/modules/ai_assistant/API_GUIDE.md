# QbitAPI Gateway — UI Integration Guide

Audience: anyone building a UI (or another service's client) against this gateway. This document describes exactly what exists today — endpoints, auth, payloads, responses, and error shapes — not the target/aspirational architecture. Where something is a known gap, it's called out explicitly so you don't build against a behavior that doesn't exist yet.

---

## 1. Base URL

Local dev: `http://localhost:8000`

All gateway routes are unprefixed by version in the path except `/v1/...` — there is currently only one API version.

---

## 2. Authentication

There is no gateway-specific API key. Every authenticated endpoint expects the **same bearer JWT** your app already uses elsewhere in the QbitsERP fleet (issued by `UsersAuthAPI`, validated the same way `EDmsAPI`/`AccountingAPI`/etc. validate it).

```
Authorization: Bearer <token>
```

The gateway decodes the token itself (HS256, shared secret) and reads these claims:

| Claim | Required | Used as |
|---|---|---|
| `organization_id` | Yes | Organization/tenant boundary — scopes budget, rate limits, cache, chat history |
| `nameid` (or `sub`) | Yes | User id — scopes chat history and per-user rate limiting |
| `role_id` | No | Carried through, not currently enforced by the gateway |
| `email` | No | Carried through, not currently enforced |
| `permission` | No | Carried through, not currently enforced |

If the token is missing, malformed, expired, or missing `organization_id`/user-id claims, every protected endpoint returns **401** (see §5).

There is currently **no per-policy access control (RBAC)** — any caller with a valid token can use any routing policy listed in `/v1/models`.

---

## 3. Core concepts before you build

**`model` is a routing policy name, not a literal model.**
The gateway resolves whatever string you send in `model` to one of the named policies in §7 (exact name match → known model id match → keyword heuristics → default policy). It then tries that policy's primary model, falling back through its chain on failure. **The `model` field in the response is the literal model that actually served the request** (e.g. `"google:gemini-2.5-flash"`), which can differ from what you requested if a fallback fired. Don't assume `response.model === request.model`.

**Conversation history is opt-in via `X-Session-Id`.**
If you send an `X-Session-Id` header, the gateway loads prior turns for that `(organization_id, user_id, session_id)` triple from Postgres, prepends them to your messages, and persists the new turn afterward — this is what gives you multi-turn memory. Omit the header and every request is stateless. Session IDs are scoped by org + user server-side, so you don't need to make them globally unique — a UUID per chat window is enough.

**Streaming is not implemented.** The request body accepts `stream: true` for OpenAI-SDK compatibility, but it is currently ignored — every response is a single, complete JSON body. Do not build an `EventSource`/SSE reader against this endpoint yet.

**Budgets are not yet configured server-side.** `/v1/budget` will report `0` for every organization until per-org budgets are wired up (tracked, not user-facing yet — see §8). Don't build a UI that assumes real numbers here today.

---

## 4. Endpoints

### 4.1 `POST /v1/chat/completions`

OpenAI-compatible chat completion. This is the main endpoint.

**Auth:** required.

**Headers:**

| Header | Required | Purpose |
|---|---|---|
| `Authorization` | Yes | `Bearer <token>` |
| `Content-Type` | Yes | `application/json` |
| `X-Session-Id` | No | Groups this request into a persisted conversation thread (see §3) |
| `X-Gateway-Policy` | No | Force a specific routing policy, overriding the `model` field resolution |
| `X-Request-Id` | No | Client-supplied correlation id (currently accepted but not echoed back — the response `id` is always server-generated) |

**Request body:**

```jsonc
{
  "model": "erp-default",              // required — routing policy name (see §7) or a known model id
  "messages": [                        // required
    { "role": "system", "content": "You help finance staff with invoice questions." },
    { "role": "user", "content": "Show me overdue invoices for customer C-4421." }
  ],
  "temperature": 0.2,                  // optional — overrides the policy's default
  "max_tokens": 1024,                  // optional — overrides the policy's default
  "stream": false,                     // optional — accepted, currently has no effect (see §3)
  "user": "42"                         // optional — ignored; user identity comes from the JWT, not this field
}
```

`messages[].role` is a free string forwarded to the model — use the usual `system` / `user` / `assistant`.

**Response — `200 OK`:**

```jsonc
{
  "id": "chatcmpl-5b4e058c-dbff-4723-8dfa-cd84f5acf809",
  "object": "chat.completion",
  "created": 1751888000,
  "model": "google:gemini-2.5-flash",   // the model that actually served it — see §3
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Here are the overdue invoices..." },
      "finish_reason": "stop"           // this is the only value ever returned today
    }
  ],
  "usage": {
    "prompt_tokens": 214,
    "completion_tokens": 87,
    "total_tokens": 301
  }
}
```

**Error cases:** see §5.

---

### 4.2 `GET /v1/models`

Lists the available routing policies (presented as OpenAI-style "models" so existing SDK tooling that lists models keeps working). Use this to populate a policy/assistant picker in the UI — don't hardcode policy names.

**Auth:** none required.

**Response — `200 OK`:**

```jsonc
{
  "object": "list",
  "data": [
    {
      "id": "erp-default",
      "object": "model",
      "description": "Default policy for all ERP module requests",
      "primary_model": "google:gemini-2.5-flash",
      "fallback_chain": ["openai:gpt-4o", "anthropic:claude-sonnet-4-6", "google:gemini-2.5-flash-lite"]
    },
    { "id": "erp-analytics", "...": "..." }
  ]
}
```

Full current policy list: §7.

---

### 4.3 `GET /v1/health`

Liveness/readiness check. Good for a status banner or uptime probe. No auth required.

**Response — `200 OK`:**

```jsonc
{
  "status": "ok",
  "gateway": "enterprise-ai-gateway",
  "providers_available": 7,
  "providers": [
    "google:gemini-2.5-flash",
    "google:gemini-2.5-flash-lite",
    "openai:gpt-4o",
    "openai:gpt-4o-mini",
    "anthropic:claude-sonnet-4-6",
    "anthropic:claude-haiku-4-5",
    "huggingface:llama-3-8b"
  ]
}
```

---

### 4.4 `GET /v1/budget`

Returns the caller's **own** organization's budget utilization — the organization is read from the token, not a URL/query param, so there is no way to query another org's budget.

**Auth:** required.

**Response — `200 OK`:**

```jsonc
{
  "organization_id": "7",
  "budget_usd": 0.0,
  "spent_usd": 0.0,
  "remaining_usd": 0.0,
  "utilization_pct": 0
}
```

⚠️ **Currently always reports zeroes** — see §3. Once server-side per-org budgets are configured, `spent_usd` will reflect in-memory spend accumulated since the gateway process last restarted (spend is not yet persisted across restarts either — see §8).

---

### 4.5 `GET /`

Service metadata (not versioned under `/v1`). No auth required. Useful only for a basic "is this the right environment" check.

```jsonc
{
  "service": "Enterprise AI Gateway",
  "version": "2.0.0",
  "gateway_endpoint": "/v1/chat/completions",
  "models_endpoint": "/v1/models",
  "health_endpoint": "/v1/health",
  "docs": "/docs"
}
```

`/docs` is the live FastAPI/Swagger UI — useful for manual poking during development.

---

## 5. Error handling

Every error follows FastAPI's default shape unless noted:

```json
{ "detail": "human-readable message" }
```

| Status | When | Example `detail` |
|---|---|---|
| `401` | No `Authorization` header, or `extract_bearer_token` can't parse it | `"Authentication required. Provide a bearer token via the Authorization header."` |
| `401` | Token signature invalid or expired | `"Invalid or expired token: Signature verification failed."` |
| `401` | Token valid but missing `organization_id`/user id claims | `"Token is missing required organization_id/user_id claims"` |
| `422` | Request body fails schema validation (e.g. missing `messages`) | Standard Pydantic validation array — `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}` |
| `429` | Rate limit breached (per-org or per-user) | `"Rate limit exceeded. Retry after 12 seconds."` — also sets a `Retry-After` header (seconds, integer) |
| `429` | Organization's monthly budget exhausted | `"Monthly AI budget exhausted for organization '7'. Spent: $500.00 / $500.00. Contact your administrator."` |
| `503` | All models in the resolved policy's fallback chain failed | `"All models in fallback chain exhausted for policy 'erp-default'. Errors: [...]"` |
| `503` | Gateway not finished starting up | `"Gateway orchestrator not initialised. Check startup logs."` |
| `500` | Unhandled server error | Varies |

**Important UI nuance:** both rate-limit and budget-exhausted errors return the *same* status code (`429`) with no separate `error.type`/`error.code` field. To show the right message (e.g. "slow down" vs "talk to your admin"), you currently have to pattern-match the `detail` string (`"Rate limit exceeded"` vs `"budget exhausted"`) or check for the presence of the `Retry-After` header (only set on rate-limit responses, not budget ones).

---

## 6. Minimal client example

```javascript
async function askGateway(token, sessionId, messages) {
  const res = await fetch("http://localhost:8000/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Session-Id": sessionId,   // omit for a stateless one-off request
    },
    body: JSON.stringify({
      model: "erp-default",
      messages,
    }),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const { detail } = await res.json();
    if (retryAfter) {
      // rate limited — safe to auto-retry after `retryAfter` seconds
    } else {
      // budget exhausted — surface `detail` to the user, don't auto-retry
    }
    return;
  }
  if (!res.ok) {
    const { detail } = await res.json();
    throw new Error(detail);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
```

A pre-built Python client with the same behavior already exists at `sdk/python/client.py` (`GatewayClient`) if you're integrating from a Python backend instead of a browser.

---

## 7. Available routing policies

From `config/policies.yaml` — treat this list as informational; always fetch `/v1/models` live rather than hardcoding it, since policies change independently of this doc.

| Policy | Description | Primary model | Rate limit (req/min) | Monthly budget (USD) |
|---|---|---|---|---|
| `erp-default` | Default policy for all ERP module requests | `google:gemini-2.5-flash` | 300 | 5,000 |
| `erp-analytics` | Complex ERP data analysis and reporting | `anthropic:claude-sonnet-4-6` | 60 | 10,000 |
| `erp-finance` | Finance module — invoices, purchase orders, budgets | `google:gemini-2.5-flash` | 200 | 3,000 |
| `erp-hr` | HR module — employee records, payroll, leave | `google:gemini-2.5-flash` | 150 | 2,000 |
| `customer-support` | Customer-facing support agent (CRM/ticketing) | `anthropic:claude-sonnet-4-6` | 120 | 3,000 |
| `cheap-fast` | High-volume, low-complexity — classification, tagging | `google:gemini-2.5-flash-lite` | 600 | 1,000 |
| `reasoning-high` | Complex multi-step reasoning, planning | `anthropic:claude-sonnet-4-6` | 30 | 8,000 |
| `code-gen` | Code generation, review, refactoring | `anthropic:claude-sonnet-4-6` | 60 | 2,000 |
| `health-diagnosis` | Clinical AI assistant | `google:gemini-2.5-flash` | 100 | 2,000 |

Note: the rate limits above are the *organization*-level ceiling for that policy. There's also an implicit per-user ceiling (roughly 1/10th of the org limit) enforced automatically — no separate config needed.

---

## 8. Known limitations (as of this doc)

Worth knowing before you build UI that assumes otherwise:

- **No streaming** — `stream: true` is accepted but ignored; responses are always a single complete JSON body.
- **Budgets aren't configured** — no code path currently calls `BudgetGuard.configure_organization(...)`, so `/v1/budget` always reports zeroes and the hard budget cap never triggers. The `429` budget-exhausted case in §5 is real code but currently unreachable until an org gets a budget configured.
- **Budget/rate-limit state is in-memory** — even once budgets are configured, spend and rate-limit counters reset on every gateway restart (Postgres table `gateway_organization_budgets` exists for this but isn't wired up yet).
- **No per-policy RBAC** — any authenticated caller can invoke any policy in §7 regardless of `role_id`.
- **`X-Request-Id` isn't echoed** — the response `id` field is always the gateway's own generated request id, not whatever you pass in.

---

*Keep this doc in sync with `gateway/api/chat.py`, `gateway/auth/caller_identity.py`, and `config/policies.yaml` — those are the source of truth if anything here looks stale.*
