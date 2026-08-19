FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl postgresql-client \
  && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci \
  && test -x node_modules/.bin/next \
  && test -x node_modules/.bin/prisma

FROM base AS production-dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev \
  && test -x node_modules/.bin/next \
  && test -x node_modules/.bin/prisma \
  && test -f node_modules/.prisma/client/index.js

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN ./node_modules/.bin/prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=production-dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "sh ./scripts/migrate-deploy.sh && npm run start"]
