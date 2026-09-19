# Agent contributors

This file is for **automated coding agents** (Cursor Cloud Agents, Copilot, Claude Code, etc.). Human contributors should start with [`CONTRIBUTING.md`](CONTRIBUTING.md); agents should read **both**.

## Primary reference

Follow [`CONTRIBUTING.md`](CONTRIBUTING.md) for:

- Conventional Commits
- Changesets and releases
- Lint, typecheck, and test commands
- Manual testing expectations
- PR checklist

The sections below highlight what agents most often miss.

## Before you change code

1. **Read relevant package docs** — [`packages/api/test/README.md`](packages/api/test/README.md), [`packages/app/test/README.md`](packages/app/test/README.md), [`packages/app/EAS.md`](packages/app/EAS.md).
2. **Identify affected packages** — API-only, app-only, or both. Run checks only in changed packages when possible.
3. **Prefer minimal diffs** — match existing patterns; do not refactor unrelated code.

## Commits and pull requests

- Use **Conventional Commits** for every commit and PR title.
- Scope commits when clear: `feat(api): …`, `fix(app): …`.
- One logical change per PR when practical.

## Changesets (required for releasable work)

If your change affects released behavior in `packages/api` or `packages/app`, **add a changeset** before finishing:

```sh
bun run changeset
```

Select the correct package(s) and semver level. Commit the generated file under `.changeset/`.

| Change | Typical bump |
|--------|----------------|
| Bug fix | `patch` |
| New feature / endpoint | `minor` (API) or `patch`/`minor` (app, depending on impact) |
| Breaking API or config change | `major` |

Skip changesets only for docs, CI-only, or internal refactors with no release note.

Dependabot PRs receive changesets automatically — do not duplicate.

## Commands to run

From the repo root after `bun install`:

**API changes** (`packages/api`):

```sh
cd packages/api
bun run lint
bun run typecheck
bun run test    # requires DATABASE_URL
```

**App changes** (`packages/app`):

```sh
cd packages/app
bun run lint
bun run typecheck
bun run test
bun run doctor  # when native/deps change
```

**API contract changes** — regenerate the app client after the API is runnable:

```sh
cd packages/app
bun run api:generate
```

Commit `src/lib/api-client/gen/` and add an app changeset.

**Schema changes** — in `packages/api`:

```sh
bun run db:generate   # after editing src/db/schema.ts
bun run db:migrate    # verify locally
```

## Manual testing (app changes)

CI does not run the app on a device. For any `packages/app` UI, navigation, or native behavior change:

1. Start API and app locally (see [CONTRIBUTING.md — Manual testing](CONTRIBUTING.md#manual-testing)).
2. Walk through the affected flows on an emulator, device, or dev client.
3. Record what you tested in the PR description (and screenshots/recordings for visible UI changes).

Do not mark app work complete after unit/integration tests alone if user-visible behavior changed.

## Test conventions (app)

Colocate tests and use suffix + `describe` tag:

- `.unit.test.ts(x)` → `describe("[Unit] …")`
- `.component.test.tsx` → `describe("[Component] …")`
- `.integration.test.tsx` → `describe("[Integration] …")`

Use `renderWithProviders` for integration tests; see [`packages/app/test/README.md`](packages/app/test/README.md).

## Files and directories to avoid editing

| Path | Reason |
|------|--------|
| `packages/app/src/lib/api-client/gen/**` | Generated — use `bun run api:generate` |
| `bun.lock` | Only when intentionally changing dependencies |
| `.env`, secrets | Never commit |
| `coverage/` | CI output |

## CI expectations

PRs trigger path-filtered workflows:

- `packages/api/**` → lint, typecheck, tests, coverage, Docker smoke
- `packages/app/**` → version sync, lint, typecheck, tests, coverage, doctor

Fix failures in the package you touched before requesting review.

## Release awareness

Version bumps on `main` create `api-v*` / `app-v*` tags and trigger publish pipelines. Your changeset summary becomes the changelog entry — write for end users, not implementers.

## Agent checklist

- [ ] Read `CONTRIBUTING.md` and package test READMEs
- [ ] Minimal, convention-matching diff
- [ ] Conventional commit messages / PR title
- [ ] Changeset if releasable
- [ ] Lint + typecheck + test in affected package(s)
- [ ] `api:generate` + app changeset if API contract changed
- [ ] `db:generate` if schema changed
- [ ] Manual app testing documented for UI/native changes
- [ ] PR description states what was tested and why
