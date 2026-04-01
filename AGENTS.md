## Agents Guide Index

Use only the files relevant to the task to keep context small. Open the needed guide(s) under `agents/`:

- `agents/overview.md` — high-level stack and folder shape.
- `agents/backend.md` — routing/controller/service/schema/model rules, MongoDB/data layer, AppError, naming/import guardrails.
- `agents/frontend.md` — UI patterns, toast error handling, Next.js 16 cache components, caching/revalidation, client vs server guidance.
- `agents/testing.md` — integration/unit strategy and commands.

Examples:
- Backend-only task → read `overview.md` + `backend.md`.
- Frontend-only task → read `overview.md` + `frontend.md`.
- Test work → read `testing.md` plus the domain guide it exercises.

**Global rule:** Never swallow data-fetching or API errors. Surface every failure to the UI through the toast system (server components should return error objects and let a client `ErrorHandler` trigger `showToast`). This keeps the operator aware of the full response body/status for debugging.

### Logging

- API routes under `app/api/**` are wrapped with request logging via `withRequestLogging`.
- Use the shared server logger from `lib/logging/logger.ts` for backend logs instead of adding new `console.log`/`console.error` calls when touching server code.
- Supported levels are `log`, `error`, and `debug`.
- Log files are JSON lines:
  - local dev defaults to `logs/app.log` and `logs/error.log`
  - production defaults to `/tmp/shezastar-logs/app.log` and `/tmp/shezastar-logs/error.log`
  - `LOG_DIR` can override the base directory
- Do not log request bodies, cookies, auth headers, or secrets by default.

### Use `Serena` mcp for code navigation if available.
