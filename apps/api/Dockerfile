# ==========================================
# STAGE 1: Dependencies & Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install system utilities for native builds if necessary
RUN apk add --no-cache libc6-compat

# Copy repository root package files
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/api/package*.json ./apps/api/
COPY prisma ./prisma/

# Install dependencies across workspaces
RUN npm ci

# Copy full source trees
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# Build shared types first
RUN npm run build --workspace=packages/shared-types

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS API
RUN npm run build --workspace=apps/api

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security hardening: create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy root package and lockfile
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/api/package*.json ./apps/api/
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nestjs

EXPOSE 4000

CMD ["node", "apps/api/dist/src/main"]
