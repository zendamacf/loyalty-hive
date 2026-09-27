---
"@loyalty-hive/app": patch
---

Move Sentry initialization into a dedicated provider module (`@/lib/sentry`) so release configuration stays out of the root layout.
