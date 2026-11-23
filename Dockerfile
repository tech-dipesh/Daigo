ARG NODE=24

FROM node:${NODE}-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm i -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")"

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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

# one shot image, compose runs it before the app starts
FROM deps AS migrate
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# plain node, no pnpm and no build tools, standalone already carries what it needs
FROM node:${NODE}-alpine AS app
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# ws only imports a handful of files from src, so it skips the whole build stage
FROM node:${NODE}-alpine AS ws
WORKDIR /app
ENV NODE_ENV=production PORT=3001
RUN npm i -g bun
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/prisma/generated ./prisma/generated
COPY package.json tsconfig.json ./
COPY src ./src
USER node
EXPOSE 3001
CMD ["bun", "src/server/ws-server.ts"]
