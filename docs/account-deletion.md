# Account deletion

Users delete their account in the app (Settings > Delete account) or with `DELETE /api/v1/auth/me` and the current password.

## What happens

1. The API sets `users.deleted_at` and `users.password_changed_at`.
   - Sign-in stops. The API returns 403 only when the password is correct.
   - All access tokens stop working at once.
   - Password reset and verification emails stop.
   - The email stays reserved. Sign-up with it returns 409.
2. A job in the API process runs at start and then each day. It deletes users whose `deleted_at` is more than 30 days old (`ACCOUNT_DELETION_GRACE_DAYS`). The database cascade removes their cards (including soft-deleted cards), brand requests, card view stats, shares and share invites. During the grace period, cards that the user shared are not shown to other accounts. Brands stay: they are shared catalog data.
3. After the purge the account cannot be restored.

More than one API instance can run the job. The delete is safe to repeat.

## Restore an account (operator)

Do this inside the 30 days, after the user asks support and you check that the request is real.

```sql
UPDATE users
SET deleted_at = NULL
WHERE lower(email) = lower('user@example.com')
  AND deleted_at IS NOT NULL;
```

Leave `password_changed_at` as it is. Tokens from before the deletion stay invalid, so the user signs in again.

Do the restore before the job runs, or the row is gone. To pause the purge for a user, set `deleted_at` to a recent date.
