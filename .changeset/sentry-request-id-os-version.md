---
"@loyalty-hive/api": patch
"@loyalty-hive/app": patch
---

Add `x-request-id` and `x-os-version` headers for API Sentry context. Each request gets a unique request ID for correlation, and the OS version is included for platform-specific debugging.
