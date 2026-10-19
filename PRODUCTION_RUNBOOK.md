# APNA GHAR — Production Runbook & Deployment Guide

> **Platform:** APNA GHAR ("Har Sahar Apna Ghar")  
> **Architecture:** Monorepo (NestJS 10 Core API + Next.js 15 App Router + MongoDB 7.0 + Redis 7.2)  
> **Status:** Production Ready  

---

## 1. System Architecture Overview

APNA GHAR is architected as a high-throughput, student-first accommodation and campus living platform built on clean domain-driven micro-modules.

```
                              [ Cloudflare DNS / CDN ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
         [ Next.js 15 Web App ]                      [ NestJS 10 API ]
             (Port 3000)                                (Port 4000)
                   │                                           │
                   │                                           ├──────────────┐
                   ▼                                           ▼              ▼
           [ Browser Client ]                           [ MongoDB 7.0 ]  [ Redis 7.2 ]
        (SSR / Dynamic React 19)                         (Local / M0)    (Locks & Cache)
```

---

## 2. Infrastructure Inventory & Ports

| Component | Technology | Default Port | Environment Variable | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **API Backend** | NestJS 10 / Express | `4000` | `PORT` | Business logic, payments, audits, bookings |
| **Web Frontend** | Next.js 15 / React 19 | `3000` | `PORT` | Marketplace UI, resident portal, admin portal |
| **Database** | MongoDB 7.0 | `27017` | `MONGODB_URI` | Document persistence, 2dsphere geo-indexing |
| **Distributed Cache** | Redis 7.2 Alpine | `6379` | `REDIS_URL` | Temporary bed holds (480s TTL), rate limiting |

---

## 3. Quickstart & Turn-key Deployment

### Option A: Docker Compose (Recommended)

To launch the complete four-tier production stack:

```bash
# 1. Clone repository and copy environment template
cp .env.example .env

# 2. Build and launch all containers
docker compose up -d --build

# 3. Verify health probes
curl -I http://localhost:4000/api/v1/health
curl -I http://localhost:3000
```

### Option B: Bare-Metal / VPS Node.js Deployment

```bash
# 1. Install dependencies across monorepo
pnpm install --frozen-lockfile

# 2. Build shared packages and apps
pnpm --filter @apna-ghar/shared-types build
pnpm --filter @apna-ghar/api build
pnpm --filter @apna-ghar/web build

# 3. Start API via PM2 or systemd
NODE_ENV=production node apps/api/dist/main

# 4. Start Next.js App
pnpm --filter @apna-ghar/web start
```

---

## 4. Database Indexing & Maintenance

The MongoDB database (`apna_ghar`) relies on specialized indexes that **must be verified** in production:

### Critical Production Indexes

1. **Geospatial Proximity Queries (`properties` collection):**
   ```javascript
   db.properties.createIndex({ location: "2dsphere" });
   ```
2. **Bed Temporary Locks (`beds` collection):**
   ```javascript
   db.beds.createIndex({ propertyId: 1, roomId: 1, bedLabel: 1 }, { unique: true });
   ```
3. **Verified Resident Reviews (`reviews` collection):**
   ```javascript
   db.reviews.createIndex({ propertyId: 1, status: 1, createdAt: -1 });
   db.reviews.createIndex({ studentId: 1, bookingId: 1 }, { unique: true });
   ```
4. **Unique Human-Readable Booking References (`bookings` collection):**
   ```javascript
   db.bookings.createIndex({ bookingReference: 1 }, { unique: true });
   ```
5. **Idempotent Payment Orders (`payments` collection):**
   ```javascript
   db.payments.createIndex({ orderId: 1 }, { unique: true });
   ```

---

## 5. Redis Temporary Hold Engine

The temporary hold engine enforces Lock 3 (Exact Room & Bed Selection) and guarantees zero double-bookings:

- **Key Pattern:** `booking:hold:{bedId}`
- **Value:** JSON payload with `{ studentId, bedId, expiresAt, heldAt }`
- **TTL:** 480 seconds (8 minutes)
- **Atomic Acquisition:** Evaluated using atomic Redis `SET NX EX 480`
- **Fallback Resilience:** If Redis connectivity drops, the system seamlessly transitions to `ioredis-mock` in-memory mode without terminating active user sessions.

---

## 6. Security Hardening & Enterprise Governance

### 1. HTTP Security Headers
Every request passing through `apps/api/src/common/middleware/security-headers.middleware.ts` automatically receives:
- `Content-Security-Policy`: Restricts scripts, fonts, and frame origins.
- `X-Frame-Options: SAMEORIGIN`: Eliminates UI redress and clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Prevents MIME confusion exploits.
- `Strict-Transport-Security`: HSTS enforcing HTTPS with 1-year preload.
- `Referrer-Policy: strict-origin-when-cross-origin`: Shields student path leakage.

### 2. Rate Limiting & Throttling
- Configured via `@nestjs/throttler` (`ThrottlerGuard` active globally).
- Default limit: **120 requests per minute per IP address**.
- Returns `429 Too Many Requests` when exceeded.

### 3. Authentication & RBAC
- Passwords hashed with **Argon2id**.
- Dual JWT cookies:
  - `access_token` (15m expiry, `HttpOnly`, `SameSite=Lax`)
  - `refresh_token` (7d expiry, `HttpOnly`, `SameSite=Lax`)
- Strictly enforced roles: `STUDENT`, `OWNER`, `MESS_PARTNER`, `ADMIN`.

---

## 7. Search Engine Optimization (SEO) & Sitemaps

- **Dynamic Sitemap:** Automatically available at `/sitemap.xml` generated by `apps/web/src/app/sitemap.ts`.
- **Search Engine Directives:** Managed by `apps/web/src/app/robots.ts` protecting private `/admin/` and `/student/` portals.
- **Schema.org Structured Data:**
  - `LodgingBusiness` on `/property/[slug]`
  - `WebSite` & `Organization` on root layout

---

## 8. Health Checks & Diagnostics

### Liveness & Readiness Probes
```bash
# General health probe
curl http://localhost:4000/api/v1/health

# Response format:
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-10-19T12:00:00.000Z",
    "version": "1.0.0",
    "uptime": 3600,
    "services": {
      "database": { "status": "connected", "type": "mongodb" },
      "cache": { "status": "connected", "type": "redis" }
    }
  }
}
```

---

## 9. Standard Operating Procedures (SOPs)

### Database Backup & Restore
```bash
# Create MongoDB snapshot backup
mongodump --uri="mongodb://127.0.0.1:27017/apna_ghar" --out=/backup/$(date +%Y%m%d)

# Restore from snapshot
mongorestore --uri="mongodb://127.0.0.1:27017/apna_ghar" /backup/20261019/apna_ghar
```

### Rotating JWT Secrets
1. Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in environment.
2. Restart backend instances sequentially (rolling restart).
3. Active students with valid refresh tokens will seamlessly refresh sessions upon expiry.
