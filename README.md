# LoyaltyHive 🐝

A clean, minimal mobile app for storing loyalty cards.

## Monorepo notes

- Root [`package.json` overrides](./docs/dependency-overrides.md) for why Bun pins certain transitive dependency versions.

## Get Started

```sh
# Install dependencies
bun install

# Copy local env and start the API
cp packages/api/.env.example packages/api/.env
(cd packages/api && bun run db:migrate && bun dev)

# Start the mobile app
(cd packages/app && bun start)
```

## Docker

From [`packages/api/`](packages/api/):

```bash
cp .env.compose.example .env   # production Compose secrets on the VPS
# Local/CI: build from source
docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build
# Production: pull published image
# APP_IMAGE=ghcr.io/zendamacf/loyalty-hive-api:0.2.3 docker compose up -d
```

Brand logos live in [`packages/api/public/logos/`](packages/api/public/logos/) and are served by the API image at `/logos/*`.

### Rate limiting

Auth routes enforce in-app limits (in-memory per API process): login by IP and email, signup by IP. Configure with `RATE_LIMIT_AUTH_*` in `.env` (see [`.env.example`](packages/api/.env.example)). For multi-instance or VPS deployments, you can add stricter limits at the edge (nginx, Cloudflare) in addition to these defaults.

## Releases

Release tags are created automatically when package versions change on `main`, via [`.github/workflows/tag-on-version-change.yml`](.github/workflows/tag-on-version-change.yml):

- **API** — `api-v*` tags trigger [`publish-docker.yml`](.github/workflows/publish-docker.yml) (GHCR images)
- **App** — `app-v*` tags trigger [`app-android-build.yml`](.github/workflows/app-android-build.yml) (EAS Android builds)

**Required secret:** `REPO_PAT` — a personal access token with `contents: write`. Tags must be pushed with a PAT (not `GITHUB_TOKEN`) or downstream workflows will not run. Add it under **Settings → Secrets and variables → Actions**.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development workflow, conventional commits, changesets, testing, and pull request expectations. Automated agents should also read [`AGENTS.md`](AGENTS.md).

## Android

- Release builds via EAS: [`packages/app/EAS.md`](packages/app/EAS.md)
