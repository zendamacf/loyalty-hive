# Contributing to LoyaltyHive

Thank you for contributing — whether you are a human developer or an automated agent (for example, a Cursor Cloud Agent). This guide covers how we work in this monorepo and what we expect before a pull request is ready for review.

## Repository layout

| Package | Path | Description |
|---------|------|-------------|
| API | [`packages/api/`](packages/api/) | Hono REST API, Drizzle ORM, Postgres |
| App | [`packages/app/`](packages/app/) | Expo / React Native mobile app |

The root [`package.json`](package.json) is a Bun workspace. Install once from the repo root:

```sh
bun install
```

See the [README](README.md) for local setup (API, database, Expo dev server).

## Development workflow

1. **Branch** from `main`. Use a short, descriptive name (for example `fix/login-error-message` or `feat/auth-me-endpoint`).
2. **Make focused changes.** Keep pull requests scoped to one concern when possible.
3. **Run checks locally** before opening or updating a PR (see [Quality checks](#quality-checks)).
4. **Add a changeset** when the change should appear in a release (see [Changesets](#changesets)).
5. **Open a pull request** with a clear title and description. Link related issues when applicable.
6. **Respond to review feedback** and keep the branch up to date with `main` if needed.

### Conventional commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This keeps history readable and makes release notes easier to scan.

**Format:**

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

**Common types:**

| Type | When to use |
|------|-------------|
| `feat` | New user-facing behavior |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Tooling, deps, CI, housekeeping |
| `refactor` | Code change that is not a fix or feature |
| `test` | Adding or updating tests |
| `ci` | CI/CD workflow changes |

**Scopes** (use when helpful): `api`, `app`, `release`, `deps`.

**Examples from this repo:**

```
feat(api): add GET /auth/me for authenticated user identification
fix(app): align native animation deps with Expo SDK 57
chore(release): bump api & app versions
chore: add changeset for dependency update
```

**Guidelines:**

- Use the imperative mood: `add`, `fix`, `update` — not `added` or `fixes`.
- Keep the subject line under ~72 characters.
- Squash or rebase so each merged PR tells a coherent story; the PR title often becomes the squash commit message.

Pull request titles should follow the same convention when possible.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) to version [`@loyalty-hive/api`](packages/api/package.json) and [`@loyalty-hive/app`](packages/app/package.json) independently and to generate changelogs.

### When to add a changeset

Add a changeset in your PR when the change should be released:

- New features, bug fixes, or behavior changes in `packages/api` or `packages/app`
- Dependency updates that affect consumers (Dependabot PRs get changesets automatically via CI)

**Skip a changeset** for:

- Documentation-only changes
- Internal refactors with no release impact
- CI or tooling changes that do not affect published packages

### How to add a changeset

From the repo root:

```sh
bun run changeset
```

Follow the prompts:

1. Select the affected package(s): `@loyalty-hive/api`, `@loyalty-hive/app`, or both.
2. Choose the semver bump: `patch`, `minor`, or `major`.
3. Write a short, user-facing summary (this becomes the changelog entry).

This creates a markdown file under [`.changeset/`](.changeset/). Commit it with your PR.

**Example changeset file:**

```md
---
"@loyalty-hive/api": minor
---

Added `/api/v1/auth/me` endpoint for retrieving the current user's details.
```

### Release process

Releases are driven by version bumps on `main`:

1. Pending changesets are consumed with `bun run changeset:version` (typically in a dedicated release PR).
2. That command bumps `package.json` versions, updates `CHANGELOG.md`, and removes consumed changeset files.
3. For the app, `react-native-version` syncs `app.json` via the `postversion` script — **keep `package.json` and `app.json` versions in sync**.
4. When version changes land on `main`, [`.github/workflows/tag-on-version-change.yml`](.github/workflows/tag-on-version-change.yml) creates tags:
   - `api-v*` → Docker image publish
   - `app-v*` → EAS Android build

See [README — Releases](README.md#releases) for tag and secrets details.

## Quality checks

### Pre-commit (Husky)

A [pre-commit hook](.husky/pre-commit) runs Biome auto-fix in both packages:

```sh
(cd packages/api && bun run lint:fix)
(cd packages/app && bun run lint:fix)
```

Run lint locally before committing so hooks do not surprise you.

### Per-package commands

**API** (`packages/api`):

```sh
bun run lint          # Biome check
bun run lint:fix      # Biome check + write
bun run typecheck     # tsc --noEmit
bun run test          # Integration tests (requires DATABASE_URL)
bun run db:migrate    # Apply Drizzle migrations
```

**App** (`packages/app`):

```sh
bun run lint
bun run lint:fix
bun run typecheck
bun run test
bun run doctor        # Native dep + expo-doctor checks
```

### CI

Pull request checks run automatically:

| Workflow | Triggers on | What it runs |
|----------|-------------|--------------|
| [`api-pr-checks.yml`](.github/workflows/api-pr-checks.yml) | `packages/api/**` | lint, typecheck, test (with coverage), Docker smoke tests |
| [`app-pr-checks.yml`](.github/workflows/app-pr-checks.yml) | `packages/app/**` | version sync check, lint, typecheck, test (with coverage), doctor |

Coverage thresholds live in each package's `bunfig.toml` and are enforced in CI.

### Code style

- [Biome](https://biomejs.dev/) for formatting and linting ([`biome.json`](biome.json))
- Double quotes for JavaScript/TypeScript
- Organize imports on save (Biome assist)
- Do not hand-edit generated files under `packages/app/src/lib/api-client/gen/`

## Testing

### Automated tests

| Package | Guide | Runner |
|---------|-------|--------|
| API | [`packages/api/test/README.md`](packages/api/test/README.md) | `bun test` against real Postgres |
| App | [`packages/app/test/README.md`](packages/app/test/README.md) | `bun test` with mocked RN/Expo |

**API tests** need `DATABASE_URL` (see [`packages/api/.env.example`](packages/api/.env.example)). The preload script migrates and seeds the database.

**App tests** use filename suffixes and `describe` tags:

| Tag | Suffix | Use for |
|-----|--------|---------|
| `[Unit]` | `.unit.test.ts(x)` | Pure logic, narrow hooks |
| `[Component]` | `.component.test.tsx` | Single component, bare `render()` |
| `[Integration]` | `.integration.test.tsx` | Full provider harness, screens |

Add or update tests for behavior you change. CI enforces coverage minimums.

### Manual testing

Automated tests do not replace exercising the app on a device or emulator. **Manually test app changes** before marking a PR ready, especially for:

- Navigation and screen flows
- Camera / barcode scanning
- Login, logout, and session persistence
- Card list, add, view, and delete flows
- Brightness, clipboard, and other native integrations
- Visual layout and theming

**Suggested manual test flow:**

```sh
# Terminal 1 — API
cp packages/api/.env.example packages/api/.env
(cd packages/api && bun run db:migrate && bun dev)

# Terminal 2 — App (device, emulator, or Expo Go / dev client)
cp packages/app/.env.example packages/app/.env
(cd packages/app && bun start)
```

Point `EXPO_PUBLIC_API_URL` at your running API. Use the dev client for native modules that Expo Go does not provide.

For API-only changes, verify endpoints via the running server, OpenAPI docs at `/doc`, or integration tests. For Docker-related changes, use the Compose stack described in the [README](README.md#docker).

Document what you tested in the PR description (device/OS, steps, screenshots or recordings when UI changes are significant).

## Package-specific notes

### API

- **Migrations:** After schema changes, run `bun run db:generate` then commit SQL under `packages/api/drizzle/`.
- **OpenAPI:** Routes use `hono-openapi`; the spec is served at `/doc`.
- **Brand logos:** Static files in `packages/api/public/logos/`, served at `/logos/*`.

### App

- **API client:** When API routes or schemas change, regenerate the SDK from a running API:

  ```sh
  cd packages/app
  bun run api:generate
  ```

  Commit the updated `src/lib/api-client/gen/` output and include an app changeset if the release should ship the new client.

- **Android releases:** See [`packages/app/EAS.md`](packages/app/EAS.md).
- **Versions:** `package.json` `version` and `app.json` `expo.version` must match (enforced in CI).

## Pull request checklist

Before requesting review, confirm:

- [ ] Changes are scoped and explained in the PR description
- [ ] Conventional commit / PR title format
- [ ] `bun run lint`, `bun run typecheck`, and `bun run test` pass in affected package(s)
- [ ] Changeset added (if releasing a user-facing change)
- [ ] API migrations generated and committed (if schema changed)
- [ ] App API client regenerated (if API contract changed)
- [ ] Manual testing performed for app UI/flow changes (described in PR)
- [ ] No secrets or `.env` files committed

## Getting help

- [README](README.md) — setup, Docker, releases
- [`packages/api/test/README.md`](packages/api/test/README.md) — API test patterns
- [`packages/app/test/README.md`](packages/app/test/README.md) — App test patterns
- [`packages/app/EAS.md`](packages/app/EAS.md) — Android builds

For agent-specific guidance (Cursor and similar tools), see [`AGENTS.md`](AGENTS.md).
