FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY api/package.json ./api/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY . .
RUN pnpm --filter @devos/db exec prisma generate
RUN pnpm --filter @devos/api build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/api/package.json ./api/
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/api/docker-entrypoint.sh ./api/docker-entrypoint.sh
COPY --from=build /app/packages/db/package.json ./packages/db/
COPY --from=build /app/packages/db/prisma ./packages/db/prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/api/node_modules ./api/node_modules
COPY --from=build /app/packages/db/node_modules ./packages/db/node_modules

RUN chmod +x /app/api/docker-entrypoint.sh

WORKDIR /app/api
EXPOSE 3333
ENTRYPOINT ["/app/api/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
