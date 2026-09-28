---
"@loyalty-hive/api": minor
---

Access tokens now include expiration (`exp` / `iat`). Configure lifetime with `JWT_ACCESS_TTL` (default 7 days). There is no refresh token — sign in again when a token expires.