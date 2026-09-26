---
"@loyalty-hive/app": patch
---

Fix Umami session splitting on app resume by identifying users from persisted ID before the first page view. Login-page analytics are buffered until the user signs in (then sent with their ID) or flushed when the app backgrounds without a login.
