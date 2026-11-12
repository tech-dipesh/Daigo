FROM node:22-alpine AS base
RUN npm i -g "pnpm@^10.15.10"
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build args are only dummies so env.ts passes while next collects pages, they never reach the running image
FROM deps AS build
ARG DB_URL=postgresql://user:pass@localhost:5432/daigo
ARG DIRECT_URL=postgresql://user:pass@localhost:5432/daigo
ARG ACCESS_TOKEN_SECRET=build-time-dummy-secret-build-time-dummy
ARG REFRESH_TOKEN_SECRET=build-time-dummy-secret-build-time-dummy
ARG UPSTASH_REDIS_REST_URL=https://dummy.upstash.io
ARG UPSTASH_REDIS_REST_TOKEN=dummy
ARG BREVO_API_KEY=dummy
ARG BREVO_FROM_EMAIL=dummy@example.com
ARG APP_URL=https://example.com
ARG STADIA_API=dummy
COPY . .
RUN mkdir -p public && pnpm generate && pnpm build

FROM base AS app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

# ws keeps the full tree because it runs the ts file with tsx
FROM build AS ws
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["pnpm", "exec", "tsx", "src/server/ws-server.ts"]
