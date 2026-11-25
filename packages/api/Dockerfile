# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/api/package.json packages/api/
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1-alpine AS admin-build
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/admin/package.json packages/admin/
RUN bun install --frozen-lockfile --ignore-scripts
COPY packages/admin packages/admin/
RUN cd packages/admin && bun run build

FROM deps AS runtime
WORKDIR /app/packages/api
COPY packages/api ./
# The API serves this at /admin (ADMIN_DIST_DIR defaults to ../admin/dist).
COPY --from=admin-build /app/packages/admin/dist /app/packages/admin/dist
COPY --chmod=755 packages/api/docker/entrypoint.sh /entrypoint.sh

ENV NODE_ENV=production \
  PORT=3000

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
