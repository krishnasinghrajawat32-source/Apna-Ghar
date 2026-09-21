# ==========================================
# STAGE 1: Dependencies & Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy workspace package manifests
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/web/package*.json ./apps/web/

RUN npm ci

# Copy sources
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

# Build shared types first
RUN npm run build --workspace=packages/shared-types

# Build Next.js 15 web application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/web/package*.json ./apps/web/

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start", "apps/web", "-p", "3000"]
