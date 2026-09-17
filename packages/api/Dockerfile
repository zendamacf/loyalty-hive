# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/api/package.json packages/api/
RUN bun install --frozen-lockfile

FROM deps AS runtime
WORKDIR /app/packages/api
COPY packages/api ./
COPY packages/api/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production \
  PORT=3000

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
