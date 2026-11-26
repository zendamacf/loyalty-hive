---
"@loyalty-hive/api": patch
---

Keep card view stats for each user in a new `card_views` table. The migration copies the current stats from `cards` and then removes the `view_count` and `last_viewed_at` columns. The API responses do not change.
