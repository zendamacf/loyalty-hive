---
"@loyalty-hive/api": patch
---

Make the admin API more secure:

- All admin API routes need an admin session, except login and logout.
- `ADMIN_JWT_SECRET` must have at least 32 characters. With a shorter secret, admin login is off and the server shows a warning at startup.
- Admin sessions without an expiry time are rejected.
- Admin API responses are not cached by the browser.
- Admin login rejects bodies larger than 16 KB and passwords longer than 1024 characters.
