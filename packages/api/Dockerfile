# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/api/package.json packages/api/
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM deps AS runtime
WORKDIR /app/packages/api
COPY packages/api ./
COPY --chmod=755 packages/api/docker/entrypoint.sh /entrypoint.sh

ENV NODE_ENV=production \
  PORT=3000

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
