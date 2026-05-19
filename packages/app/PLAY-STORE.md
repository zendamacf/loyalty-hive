# Google Play Store submission

Runbook for getting LoyaltyHive onto the Play Store. Steps that need actual Play Console UI work are marked **[manual]**. Steps that need an Expo account / `eas` login are marked **[manual:eas]**.

For build mechanics see [`EAS.md`](EAS.md). For local dev see [`ANDROID.md`](ANDROID.md).

---

## 1. Pre-submission checklist

- [ ] `android.package` in [`app.json`](app.json) is the final reverse-DNS ID (**immutable after first Play upload**). Current: `com.kalopsiadev.loyaltyhive`.
- [ ] Production EAS secrets set ([`EAS.md`](EAS.md#2-configure-eas-secrets)).
- [ ] Production API URL is **HTTPS** (Android release blocks cleartext).
- [ ] Upload keystore generated via `eas credentials` and backed up ([`EAS.md`](EAS.md#signing-android)).
- [ ] Privacy policy + Terms hosted at stable public HTTPS URLs (see §3).
- [ ] AAB built via `bun run build:android:production` and downloads successfully.

---

## 2. Create the app in Play Console **[manual]**

1. Sign in to [Google Play Console](https://play.google.com/console). One-time $25 developer fee if first app.
2. **Create app** → Name: `LoyaltyHive` · Default language: English (US) · App or Game: App · Free or Paid: Free.
3. Accept declarations (you've read Play Console policies, US export laws).
4. **Setup → App access**: declare login is required and provide test credentials for Play reviewers.

---

## 3. Host the legal documents **[manual]**

Play Console requires **public HTTPS URLs** for both. Markdown files in this repo are the source of truth; they need to be published.

Options:

| Option | Notes |
|--------|-------|
| GitHub Pages on this repo | Simple. Convert `.md` → published `.html` (e.g. `/legal/privacy-policy/`). |
| Static page on a marketing site | Best long-term. |
| Inline in a GitHub raw URL | Allowed but not great UX. |

Files to publish:

- [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) → e.g. `https://kalopsia.dev/loyaltyhive/privacy`
- [`TERMS-AND-CONDITIONS.md`](TERMS-AND-CONDITIONS.md) → e.g. `https://kalopsia.dev/loyaltyhive/terms`

### Gaps to fix in [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) before publishing

The current generated policy mentions only IP / page visits / OS, and only Expo and Sentry as third parties. The app does more than that. Update before submission:

| What | Add to policy |
|------|---------------|
| Email + password (account) | Stored on the LoyaltyHive backend; passwords are bcrypt-hashed. |
| Loyalty card data | `cardNumber`, `label`, brand link stored on the LoyaltyHive backend. Card numbers can be sensitive financial-adjacent identifiers. |
| Auth tokens | JWT stored locally via `expo-secure-store` (Android Keystore-backed). |
| Camera | Used solely on-device to scan barcodes/QR codes; captured codes are stored as card numbers. No image/video upload. |
| Sentry | Crash reports include device, OS, IP (`sendDefaultPii: true`), and **mobile session replays** (10% of sessions, 100% on error). Disclose this explicitly. |
| Account deletion | Provide a process (email request is fine; Play now also wants in-app or web deletion path — see §5). |

Also update [`TERMS-AND-CONDITIONS.md`](TERMS-AND-CONDITIONS.md) to reference the backend service.

---

## 4. Data safety form **[manual]**

Fill out **Policy → App content → Data safety** in Play Console using this mapping:

| Play category | Item | Collected? | Shared? | Optional? | Purpose | Notes |
|---------------|------|------------|---------|-----------|---------|-------|
| Personal info | **Email** | Yes | No | No (required) | Account management | Sign-up / login |
| Personal info | **User IDs** | Yes | No | No | Account management | UUID per account |
| Financial info | **Other financial info** (loyalty cards) | Yes | No | Yes | App functionality | Card numbers are not payment instruments but are user-entered identifiers |
| App activity | **Crashes / Diagnostics** | Yes | Yes (Sentry) | Yes (replay opt-out via uninstall) | Crash reporting, performance | Includes mobile replays |
| App info & performance | **Diagnostics** | Yes | Yes (Sentry) | Yes | Performance | |
| Device or other IDs | **Device or other IDs** | Yes | Yes (Sentry) | No | Crash reporting | Default Sentry device ID |
| Photos and videos | **Photos** | No (camera is processed on-device, no images stored or sent) | No | — | — | Declare camera permission but “no data collected” |

Security practices:

- Data **is** encrypted in transit (HTTPS).
- Users can request deletion via email (until in-app deletion ships).
- Independent security review: No (unless you have one).
- Committed to Play Families policy: No.

---

## 5. Account deletion **[manual + future code]**

Play now requires either an in-app deletion flow or a public web form for any app with accounts. Short-term: state in the privacy policy that users may email `kalopsia.dev@gmail.com` for deletion. Plan a follow-up to add an in-app **Delete account** action that calls a new `DELETE /api/v1/auth/account` endpoint.

---

## 6. Content rating, target audience, ads **[manual]**

- **Content rating** questionnaire: app is utility / no UGC / no violence → likely rated *Everyone*.
- **Target audience**: 13+ (matches privacy policy “not directed at children under 13”).
- **Ads**: declare **No** (no ads in app).
- **Government apps**: No.
- **News app**: No.

---

## 7. Store listing assets **[manual prep]**

| Asset | Spec | Status |
|-------|------|--------|
| App icon | 512×512 PNG (no alpha) | Source [`assets/images/icon.png`](assets/images/icon.png); Play generates from upload metadata |
| Feature graphic | 1024×500 PNG/JPG | **TODO** — needs design |
| Phone screenshots | At least 2, up to 8, 1080×1920 (or any 16:9–9:16) | **TODO** — capture from emulator (Pixel 7 profile) for: Login, Cards list, Card code (1D), Card code (2D), Scan |
| Short description | ≤ 80 chars | Draft below |
| Full description | ≤ 4000 chars | Draft below |
| App category | Lifestyle (suggested) or Productivity | Pick during listing |
| Contact email | `kalopsia.dev@gmail.com` | |
| Privacy policy URL | Hosted URL from §3 | |

### Draft short description

> Keep every loyalty card in one place. Scan once, leave the wallet at home.

### Draft full description

> LoyaltyHive is a clean, minimal place for your loyalty cards.
>
> • Scan barcodes and QR codes with your camera to add cards instantly.
> • See cards as the original barcode or QR, full-screen for cashier scanners.
> • Label cards and pick a brand to keep things tidy.
> • Works offline once your cards are loaded.
>
> Everything is end-to-end TLS encrypted on the way to our servers, and your auth token lives in Android Keystore — not in plain storage.
>
> Questions or feedback: kalopsia.dev@gmail.com

---

## 8. Build, upload, release **[manual:eas + manual]**

### First release — Internal testing track

```sh
cd packages/app
bun run build:android:production
# Wait for the EAS build; download the .aab from the dashboard.
```

In Play Console:

1. **Testing → Internal testing → Create new release**.
2. Upload the AAB.
3. **What's new**: short release notes.
4. **Save → Review release → Start rollout to Internal testing**.
5. **Testers** tab: add a Google Group or list of test emails. Share the opt-in link.

Internal testing builds are available a few minutes after roll-out (no Play review).

### Promoting to Production

When ready:

1. **Production → Create new release** (or **Promote** from Internal testing).
2. Set release notes and roll-out percentage (start at 20%).
3. **Submit for review**. Initial review can take a few days.

---

## 9. Versioning discipline

Every Play release needs:

- A **higher** `android.versionCode` in [`app.json`](app.json) (or EAS remote versioning — `cli.appVersionSource: "remote"` is already enabled in [`eas.json`](eas.json), so EAS will auto-increment).
- An updated user-visible `expo.version` (e.g. `0.1.0` → `0.2.0`) — keep this aligned with @changesets bumps.

Recommended flow:

```sh
# Bump @loyalty-hive/app via changesets
bun run changeset
bun run changeset:version
git commit -am "release: app 0.x.y"
bun run build:android:production
```

---

## 10. Optional: automate uploads with `eas submit`

After the first manual upload, create a Play **service account** with the *Release manager* role, download its JSON key, and add it as an EAS secret:

```sh
bunx eas secret:create --name GOOGLE_SERVICE_ACCOUNT_KEY --type file --value /path/to/play-service-account.json --scope project
```

Then in [`eas.json`](eas.json) extend `submit.production`:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "google-service-account.json",
      "track": "internal"
    }
  }
}
```

After that:

```sh
bunx eas submit --platform android --profile production --latest
```

Tracks worth automating: `internal` → manual promotion to `production`.

---

## 11. Post-release smoke test

- [ ] Install via Play internal track link on a real device.
- [ ] Sign up + log in against production API.
- [ ] Add a card via the scan flow (camera permission grants).
- [ ] Reopen the app — session still active (`expo-secure-store` works).
- [ ] Force a test crash; verify it shows up in Sentry and `EXPO_PUBLIC_SENTRY_DSN` is set.
