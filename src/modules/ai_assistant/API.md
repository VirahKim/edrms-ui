# QbitAPI Gateway — Endpoint Reference

Base URL: `http://localhost:8000` (or wherever the gateway is deployed).

## Authentication

Every endpoint except `/v1/models` and `/v1/health` requires a bearer JWT,
signed with the shared `AUTH_JWT_SECRET`. The gateway does not mint tokens —
pass whatever signed token your auth system already issues.

```
Authorization: Bearer <jwt>
```

The token's claims must include `organization_id` and a user id (`nameid` or
`sub`). All conversation/budget data is scoped to these two values — a caller
can only ever see their own organization's and their own data.

---

## POST /v1/chat/completions

OpenAI-compatible chat completion. `model` is a routing policy name (see
`GET /v1/models`), not a raw provider model id.

**Headers**

| Header          | Required | Notes                                                        |
|------------------|----------|---------------------------------------------------------------|
| `Authorization`  | yes      | `Bearer <jwt>`                                                |
| `X-Session-Id`   | no       | Groups this exchange into a conversation. Omit for one-off, stateless calls. |
| `X-Gateway-Policy` | no     | Override the routing policy without changing `model`.        |
| `X-Request-Id`   | no       | Caller-supplied request id for tracing.                      |

**Request body**

```json
{
  "model": "erp-default",
  "messages": [
    { "role": "user", "content": "Summarize this invoice." }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "stream": false
}
```

Only send the *new* message(s) each turn — if `X-Session-Id` is set, the
gateway automatically prepends the stored conversation history server-side
before calling the model.

**Response `200`**

```json
{
  "id": "chatcmpl-8029d310-3c78-4955-b744-25eccb0b91cb",
  "object": "chat.completion",
  "created": 1751970858,
  "model": "google:gemini-2.5-flash",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 120,
    "completion_tokens": 340,
    "total_tokens": 460
  }
}
```

**Errors**: `401` no/invalid token, `503` orchestrator not ready, `500` unhandled
provider/routing error.

---

## GET /v1/models

List available routing policies (presented as "models" for OpenAI-client
compatibility). No auth required.

**Response `200`**

```json
{
  "object": "list",
  "data": [
    {
      "id": "erp-default",
      "object": "model",
      "description": "Default ERP assistant policy",
      "primary_model": "google:gemini-2.5-flash",
      "fallback_chain": ["openai:gpt-4o-mini"]
    }
  ]
}
```

---

## GET /v1/health

Gateway/provider health check. No auth required.

**Response `200`**

```json
{
  "status": "ok",
  "gateway": "enterprise-ai-gateway",
  "providers_available": 3,
  "providers": ["google", "openai", "anthropic"]
}
```

---

## GET /v1/budget

Caller's own organization's monthly spend summary.

**Headers**: `Authorization: Bearer <jwt>` (required)

**Response `200`**: shape returned by `BudgetGuard.summary()` — organization id,
monthly budget, spend to date, period window.

---

## GET /v1/conversations

List the caller's own conversations (sessions), most recently active first.
Scoped to the `organization_id`/`user_id` in the token.

**Headers**: `Authorization: Bearer <jwt>` (required)

**Query params**

| Param    | Default | Notes                     |
|----------|---------|---------------------------|
| `limit`  | 50      | Max conversations returned |
| `offset` | 0       | Pagination offset          |

**Response `200`**

```json
{
  "object": "list",
  "data": [
    {
      "session_id": "b3b0e6b0-9e2b-4b7a-9c1a-9a6f6a6f6a6f",
      "created_at": "2026-07-08T11:14:18.062617+00:00",
      "updated_at": "2026-07-08T11:20:03.512000+00:00",
      "title": "Summarize this invoice for acme corp please…",
      "preview": "Sure, here is the summary..."
    }
  ]
}
```

`title` and `preview` are not stored columns — `gateway_conversations` has no
title field. They're derived on read from `gateway_messages`: `title` is the
first user message in the conversation (truncated to 60 chars), `preview` is
the most recent message of either role (truncated to 80 chars). Both are
`null` if the conversation somehow has no messages yet.

---

## GET /v1/conversations/{session_id}/messages

Full message history for one of the caller's own conversations, oldest first.

**Headers**: `Authorization: Bearer <jwt>` (required)

**Path params**: `session_id` — must belong to the caller's `organization_id`/`user_id`;
otherwise returns an empty list (not another user's data).

**Query params**

| Param    | Default | Notes                 |
|----------|---------|------------------------|
| `limit`  | 100     | Max messages returned |
| `offset` | 0       | Pagination offset      |

**Response `200`**

```json
{
  "object": "list",
  "session_id": "b3b0e6b0-9e2b-4b7a-9c1a-9a6f6a6f6a6f",
  "data": [
    { "role": "user", "content": "Summarize this invoice.", "created_at": "2026-07-08T11:14:18.062617+00:00" },
    { "role": "assistant", "content": "...", "created_at": "2026-07-08T11:14:21.884000+00:00" }
  ]
}
```
