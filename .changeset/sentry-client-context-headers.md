---
"@loyalty-hive/api": patch
"@loyalty-hive/app": patch
---

Add client identification headers for API Sentry errors. The app sends `x-client-id`, `x-app-version`, `x-app-build`, and `x-app-platform` on API requests; the API enriches Sentry with these values as tags and context.
