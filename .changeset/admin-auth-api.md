---
"@loyalty-hive/api": minor
---

Add admin login for the admin panel: `POST /api/v1/admin/auth/login`, `POST /api/v1/admin/auth/logout`, and `GET /api/v1/admin/auth/me`. The session is in an httpOnly cookie. Set `ADMIN_JWT_SECRET` to a value different from `JWT_ACCESS_SECRET` to turn on admin login. These routes are not in the public API docs.
