---
"@loyalty-hive/api": patch
---

Fix: clients could fake their IP address with the `X-Forwarded-For` header to get around login and signup rate limits. The API now trusts only the last `TRUST_PROXY_HOPS` entries of `X-Forwarded-For` (set by your own proxies), and only when the connection comes from a private address. `X-Real-IP` is no longer used. The Docker Compose file sets `TRUST_PROXY_HOPS=1` (one proxy, such as Traefik). Old rate limit entries are now removed from memory.
