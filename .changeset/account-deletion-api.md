---
"@loyalty-hive/api": minor
---

Add account deletion: `DELETE /api/v1/auth/me` with the current password. The account is closed at once, and its data is removed for good after 30 days.
