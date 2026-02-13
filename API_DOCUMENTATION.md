# Astro Shiva Backend API Contract (v2.2)

Last fully validated: **February 12, 2026**  
Architecture: **Next.js 16 Route Handlers + AI SDK 6 + Convex + Clerk JWT**  
Primary chat endpoint: **`POST /api/v1/chat/stream`** (SSE)

This document is the source-of-truth contract for frontend and AI-agent clients. If behavior conflicts with older code comments or legacy endpoints, follow this document.

## 1. Scope And Non-Scope

In scope:
- All production `/api/v1/*` endpoints
- `/api/docs` machine-readable summary
- Auth, validation, rate limits, pagination, SSE behavior, error model

Out of scope:
- Internal Convex function signatures
- Legacy development test routes
- Deprecated `/api/chat` and `/api/v1/chat/send` behavior beyond migration guidance

## 2. Base URLs

- Local: `http://127.0.0.1:3000`
- Production: `https://astro-shiva-app.vercel.app`

## 3. Authentication

Protected endpoints require:

```http
Authorization: Bearer <clerk_jwt>
```

Auth behavior:
- Missing token: `401` + `MISSING_TOKEN`
- Expired token: `401` + `TOKEN_EXPIRED`
- Invalid token: `401` + auth error code

All business endpoints under `/api/v1` require auth **except**:
- `GET /api/v1/health`
- `GET /api/v1/metrics`
- `POST /api/v1/chat/send` (deprecated, always returns `410`)
- `OPTIONS` preflights

## 4. Global Conventions

## 4.1 Request Content Type
- JSON endpoints require `Content-Type: application/json`
- Invalid content type returns `415 VALIDATION_ERROR` on chat stream

## 4.2 Common Response Envelope
Success shape:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-02-12T18:57:21.024Z"
  }
}
```

Error shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-02-12T18:57:21.024Z",
    "requestId": "req_..."
  }
}
```

## 4.3 Request Correlation
- Client may send `X-Request-ID`
- Server usually returns `X-Request-ID`

## 4.4 CORS
- Preflight: `OPTIONS` returns `204`
- Allowed origins are environment-driven (`ALLOWED_ORIGINS`) with production-safe defaults

## 4.5 Rate-Limit Headers
Returned by throttled endpoints (not all endpoints):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (ISO timestamp)

## 5. Endpoint Matrix

| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/v1/health` | `GET`, `OPTIONS` | No | Health status |
| `/api/v1/metrics` | `GET`, `OPTIONS` | No | Prometheus metrics |
| `/api/v1/users/onboard` | `POST`, `OPTIONS` | Yes | Compute astro data via Python service and persist in Convex |
| `/api/v1/users/profile` | `GET`, `PUT`, `OPTIONS` | Yes | Get/update user profile |
| `/api/v1/chat/stream` | `POST`, `OPTIONS` | Yes | Primary chat streaming endpoint (SSE) |
| `/api/v1/chat/send` | `POST`, `OPTIONS` | No | Deprecated endpoint, always `410` |
| `/api/v1/chat/sessions` | `GET`, `POST`, `OPTIONS` | Yes | List/create sessions |
| `/api/v1/chat/sessions/{sessionId}` | `DELETE`, `OPTIONS` | Yes | Delete session |
| `/api/v1/chat/sessions/{sessionId}/messages` | `GET`, `OPTIONS` | Yes | Get session messages with ownership checks |
| `/api/v1/jobs/status` | `GET`, `POST`, `OPTIONS` | Yes | Poll/create jobs |
| `/api/v1/jobs/{id}` | `GET`, `DELETE`, `OPTIONS` | Yes | Get/cancel job |
| `/api/docs` | `GET` | No | Machine-readable API summary |

## 6. Contracts By Endpoint

## 6.1 `GET /api/v1/health`
Purpose:
- Liveness check

Responses:
- `200` healthy
- `503` degraded (dependency failure)

Sample:

```json
{
  "success": true,
  "status": "healthy",
  "dependencies": {
    "convex": {
      "status": "healthy",
      "latency": 0
    }
  }
}
```

## 6.2 `GET /api/v1/metrics`
Purpose:
- Prometheus plaintext metrics

Responses:
- `200 text/plain`
- `500 text/plain` on collector failure

## 6.3 `POST /api/v1/users/onboard`
Purpose:
- Validates birth details
- Calls external Python astrology service
- Generates summary
- Persists completed user astro profile in Convex

Request body:

```json
{
  "name": "Final QA User",
  "dateOfBirth": "1990-01-01T00:00:00.000Z",
  "timeOfBirth": "12:00",
  "place": "Austin, Texas",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "timezone": "America/Chicago"
}
```

Validation:
- `name`: string, min 2, max 100
- `dateOfBirth`: ISO datetime
- `timeOfBirth`: `HH:mm`
- `place`: string, min 2
- `latitude`: optional, `-90..90`
- `longitude`: optional, `-180..180`
- `timezone`: optional string

Behavior:
- Python backend may cold-start on Render
- API uses retries and timeout handling
- First attempt can take ~60–180 seconds

Responses:
- `200` onboarding completed
- `400 VALIDATION_ERROR`
- `401` auth error
- `502 ASTRO_API_ERROR`
- `504 ASTRO_API_TIMEOUT` (retryable)
- `500 INTERNAL_ERROR`

Success sample:

```json
{
  "success": true,
  "message": "Onboarding completed successfully!",
  "data": {
    "uid": "user_xxx",
    "status": "completed",
    "astroData": {
      "summary": "...",
      "ascendant": "Pisces",
      "moonSign": "Aquarius"
    }
  }
}
```

## 6.4 `GET /api/v1/users/profile`
Purpose:
- Fetch authenticated user profile and astro data

Special case:
- If user record does not exist yet, returns `200` with `status: "processing"` and `astroData: null` (not 404)

Responses:
- `200`
- `401` auth error
- `500 INTERNAL_ERROR`

Success sample:

```json
{
  "success": true,
  "data": {
    "id": "jd...",
    "name": "Final QA User",
    "status": "completed",
    "astroData": {
      "summary": "...",
      "ascendant": "Pisces",
      "moonSign": "Aquarius",
      "chart": {},
      "divisionalCharts": {},
      "dashas": {},
      "planetaryPositions": {},
      "d1": {},
      "d10": {},
      "currentDasha": {}
    }
  }
}
```

## 6.5 `PUT /api/v1/users/profile`
Purpose:
- Update user profile metadata

Request body:

```json
{
  "name": "Final QA User Updated",
  "email": "optional@example.com"
}
```

Validation:
- `name` optional, 2..100
- `email` optional, valid email

Responses:
- `200`
- `400 VALIDATION_ERROR`
- `401` auth error
- `404 USER_NOT_FOUND`
- `500 INTERNAL_ERROR`

## 6.6 `POST /api/v1/chat/stream` (Primary Chat)
Purpose:
- Authenticated, session-aware SSE streaming
- AI SDK 6 tool-calling orchestration
- Server-side tool access to Convex-backed astrology data
- Persist user+assistant messages in Convex

Request body (either style):

```json
{
  "sessionId": "optional-existing-session-id",
  "message": "Analyze my love life using D9 and current dasha.",
  "model": "LongCat-Flash-Thinking-2601"
}
```

or

```json
{
  "sessionId": "optional-existing-session-id",
  "messages": [
    {
      "id": "msg-client-1",
      "role": "user",
      "parts": [{ "type": "text", "text": "Hello" }]
    }
  ],
  "model": "LongCat-Flash-Thinking-2601"
}
```

Contract notes:
- At least one of `message` or non-empty `messages` is required
- `sessionId` omitted => server auto-creates session
- Provided `sessionId` must be owned by caller
- `messages` are validated server-side via AI SDK `validateUIMessages`
- Response message IDs are server-generated (`msg-*`)

Headers on success:
- `Content-Type: text/event-stream`
- `X-Session-ID: <authoritative-session-id>`
- `X-Request-ID: <request-id>`
- `X-RateLimit-*`

Responses:
- `200` SSE stream
- `400 VALIDATION_ERROR`
- `401` auth error
- `403 FORBIDDEN` (session not owned)
- `404 USER_NOT_FOUND` or `SESSION_NOT_FOUND`
- `409 USER_NOT_READY` (onboarding not completed)
- `413 VALIDATION_ERROR` (payload too large)
- `415 VALIDATION_ERROR` (wrong content type)
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

SSE stream example (truncated):

```text
data: {"type":"start","messageMetadata":{"requestId":"req_...","sessionId":"ks..."},"messageId":"msg-..."}

data: {"type":"start-step"}

data: {"type":"message-metadata","messageMetadata":{"requestId":"req_...","sessionId":"ks..."}}

data: {"type":"text-delta","delta":"I'll analyze your chart..."}

data: {"type":"finish-step"}
```

Streaming persistence guarantees:
- User message is stored before model generation
- Assistant message is stored on stream finish when not aborted
- For aborted streams, persistence may be partial by design

## 6.7 `POST /api/v1/chat/send` (Deprecated)
Always returns:
- `410 DEPRECATED_ENDPOINT`
- Use `/api/v1/chat/stream`

## 6.8 `GET /api/v1/chat/sessions`
Purpose:
- List authenticated user sessions

Query params:
- `limit` optional, default `20`, min `1`, max `100`
- `offset` optional, default `0`, min `0`

Responses:
- `200`
- `401` auth error
- `404 USER_NOT_FOUND`
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

Success sample:

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "ks...",
        "title": "Final Signoff Session",
        "createdAt": "2026-02-12T18:56:56.088Z",
        "lastMessageAt": "2026-02-12T18:57:17.263Z",
        "messageCount": 2,
        "status": "active",
        "metadata": { "topic": "qa-signoff" }
      }
    ],
    "total": 1,
    "hasMore": false
  },
  "meta": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

## 6.9 `POST /api/v1/chat/sessions`
Purpose:
- Create a new chat session

Body:

```json
{
  "title": "New Chat",
  "metadata": { "topic": "app-session" }
}
```

`title` and `metadata` are optional.

Responses:
- `201` created
- `400 VALIDATION_ERROR` (invalid JSON)
- `401` auth error
- `404 USER_NOT_FOUND`
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

## 6.10 `DELETE /api/v1/chat/sessions/{sessionId}`
Purpose:
- Delete/soft-delete a chat session

Behavior:
- Performs ownership check before deletion
- Session must belong to authenticated user

Responses:
- `200` session deleted
- `401` auth error
- `403 FORBIDDEN` (session not owned by user)
- `404 SESSION_NOT_FOUND`
- `500 INTERNAL_ERROR`

Success sample:

```json
{
  "success": true,
  "message": "Session deleted successfully",
  "meta": {
    "timestamp": "2026-02-12T18:57:21.024Z"
  }
}
```

## 6.11 `GET /api/v1/chat/sessions/{sessionId}/messages`
Purpose:
- Paginated messages for one session with ownership checks

Query params:
- `limit` optional, default `50`, min `1`, max `100`
- `offset` optional, default `0`, min `0`

Responses:
- `200`
- `400 VALIDATION_ERROR` (missing sessionId)
- `401` auth error
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

Success sample:

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "j...",
        "role": "user",
        "content": "Analyze my love life...",
        "createdAt": "2026-02-12T18:56:59.117Z"
      },
      {
        "id": "j...",
        "role": "assistant",
        "content": "I'll analyze your love life...",
        "createdAt": "2026-02-12T18:57:17.263Z"
      }
    ],
    "session": {
      "id": "ks...",
      "title": "Final Signoff Session",
      "status": "active",
      "messageCount": 2,
      "createdAt": 1770922616088
    }
  },
  "meta": {
    "total": 2,
    "limit": 50,
    "offset": 0,
    "hasMore": false,
    "sessionId": "ks..."
  }
}
```

## 6.12 `GET /api/v1/jobs/status`
Purpose:
- Poll job status

Query params:
- `jobId` optional string
- `uid` optional string
- At least one is required
- Non-admin users cannot query another user's jobs

Responses:
- `200`
- `400 VALIDATION_ERROR` (missing both `uid` and `jobId`)
- `401` auth error
- `403 FORBIDDEN`
- `404 JOB_NOT_FOUND`
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

## 6.13 `POST /api/v1/jobs/status`
Purpose:
- Create async job record

Body:

```json
{
  "type": "analysis",
  "data": { "source": "frontend" },
  "priority": "normal",
  "expiresInMs": 86400000
}
```

Validation:
- `type` required string
- `data` optional object
- `priority` optional (low|normal|high|critical expected by tracker)
- `expiresInMs` optional number

Responses:
- `201`
- `400 VALIDATION_ERROR`
- `401` auth error
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

## 6.14 `GET /api/v1/jobs/{id}`
Purpose:
- Detailed job lookup

Query params:
- `includeData` optional (`true`/`false`), default `false`
- `includeResult` optional (`true`/`false`), default `true`

Responses:
- `200`
- `400 VALIDATION_ERROR` (invalid job id format)
- `401` auth error
- `403 FORBIDDEN`
- `404 JOB_NOT_FOUND`
- `429 RATE_LIMIT_EXCEEDED`
- `500 INTERNAL_ERROR`

## 6.15 `DELETE /api/v1/jobs/{id}`
Purpose:
- Cancel pending/queued/processing jobs

Cancellation constraints:
- Allowed states: `pending`, `queued`, `processing`
- Other states return `409 INVALID_STATE`

Responses:
- `200`
- `400 VALIDATION_ERROR`
- `401` auth error
- `403 FORBIDDEN`
- `404 JOB_NOT_FOUND`
- `409 INVALID_STATE`
- `500 INTERNAL_ERROR`

## 7. Deprecated And Development Endpoints

Deprecated:
- `POST /api/v1/chat/send` => `410`, use `/api/v1/chat/stream`
- `POST /api/chat` => in production returns `410`, legacy dev compatibility only

Development/test-only endpoints (not frontend contract):
- `/api/health/stream`
- `/api/test-ai`
- `/api/test-minimal`
- `/api/test-prompts`
- `/api/test-providers`
- `/api/test-sdk`
- `/api/test-tools`

## 8. Canonical Frontend Integration Flow

1. Authenticate with Clerk, obtain JWT.
2. Onboarding: call `POST /api/v1/users/onboard` with birth details.
3. Poll/read `GET /api/v1/users/profile` until `status` is `completed`.
4. Create session via `POST /api/v1/chat/sessions` (optional; stream endpoint can auto-create).
5. Stream chat via `POST /api/v1/chat/stream`.
6. Persist and reload state via:
   - `GET /api/v1/chat/sessions`
   - `GET /api/v1/chat/sessions/{sessionId}/messages`
7. For background workflows, use jobs endpoints.

## 9. AI-Agent Client Rules (Anti-Hallucination)

Hard rules for autonomous frontend agents:
- Always target **`/api/v1/chat/stream`**, never `/api/chat` or `/api/v1/chat/send`.
- Always include `Authorization: Bearer <clerk_jwt>` on protected routes.
- Treat `X-Session-ID` from stream response as canonical session ID.
- Assume unknown JSON fields may be ignored; only rely on documented fields.
- Parse SSE incrementally and tolerate additional event `type` values.
- Handle `504 ASTRO_API_TIMEOUT` with retry/backoff (first retry after 5-10s).
- Handle `401` by refreshing/reacquiring JWT, not blind retries.
- Handle `403`/`404` on session access by refreshing session list and re-selecting valid session.

## 10. Validation Evidence

Latest launch-signoff evidence (local):
- `npm run build` ✅
- `npm run test:e2e:smoke` ✅ (`9 passed`)
- Full script signoff of auth + `/api/v1` + streaming + sessions + jobs ✅

Validated scenarios include:
- Auth negative paths (401)
- Onboarding success and timeout handling path coverage
- Session creation/list/history
- SSE stream with persisted assistant reply
- Deprecated endpoint behavior (`410`)
- Jobs create/poll/detail/cancel lifecycle
