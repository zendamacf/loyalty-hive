---
"@loyalty-hive/api": minor
---

Add in-memory rate limiting on auth login and signup routes (per IP and per email on login), configurable via `RATE_LIMIT_AUTH_*` environment variables. Exceeded limits return HTTP 429 with a JSON error body.