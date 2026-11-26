---
"@loyalty-hive/api": minor
---

Add card sharing. A user can share one card, or all their cards (also cards added later), with another existing account. The recipient gets an email with a link that works one time and expires after 7 days. Shared cards are read-only: only the owner can change or delete them. The owner can cancel an invite or stop a share, and the recipient can leave a share. Card responses now have `ownership` and `sharedBy`. New endpoints: `POST /api/v1/shares`, `GET /api/v1/shares/outgoing`, `GET /api/v1/shares/incoming`, `POST /api/v1/shares/preview`, `POST /api/v1/shares/accept`, `DELETE /api/v1/shares/invites/{id}`, and `DELETE /api/v1/shares/{id}`.
