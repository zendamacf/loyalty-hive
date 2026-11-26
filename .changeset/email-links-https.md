---
"@loyalty-hive/api": patch
---

Make the buttons in verification and password reset emails work in Gmail. Email links now go to the API, which redirects to the app, because Gmail removes direct app links. Set the new `BASE_URL` to the API's public URL to turn this on. Brand logos are also served from `BASE_URL` now, and `FILE_STORAGE_URL` becomes an optional override. `APP_DEEP_LINK_BASE` can point the redirect at a development build such as Expo Go.
