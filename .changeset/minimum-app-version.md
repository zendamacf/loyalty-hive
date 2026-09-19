---
"@loyalty-hive/api": minor
"@loyalty-hive/app": patch
---

Add minimum app version enforcement: new `GET /api/v1/meta/app-version` endpoint (API key only) and a launch-time version check that blocks outdated clients with an update screen.
