# APNA GHAR (अपना घर)
> *"Har Safar, Apna Ghar"* — Comprehensive Student Accommodation & Living Platform

Apna Ghar is a production-grade, full-stack student housing platform integrating verified PG/room discovery, bed-level atomic availability, PostGIS campus radius search, 360° virtual tours, visit scheduling, instant booking with temporary inventory holds, automated payment settlement, and local mess/tiffin meal plans.

---

## 🏗 System Architecture Overview

Apna Ghar follows a **Modular Monolith** architecture:
- **Frontend (`apps/web`):** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Backend (`apps/api`):** NestJS, TypeScript, Passport JWT, Swagger/OpenAPI (`/api/v1/`).
- **Persistence (`prisma`):** PostgreSQL 16 + PostGIS Spatial Engine, Prisma ORM.
- **Cache & Concurrency:** Redis 7 (Distributed locking, atomic bed holds, session revocation, sliding-window rate limiting).
- **Security:** Argon2id password hashing, HTTP-Only `SameSite=Lax` cookies, NestJS RBAC guards (`STUDENT`, `OWNER`, `FOOD_PARTNER`, `ADMIN`).

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `>= 20.x` (LTS recommended, v24 tested)
- **npm:** `>= 10.x`
- **PostgreSQL:** `>= 15.x` (with PostGIS extension enabled)
- **Redis:** `>= 6.x` (Local or hosted via Redis Cloud / Docker)

---

## 🚀 Quickstart & Setup Guide

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url> apna-ghar
cd apna-ghar

# Install all workspace dependencies
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` in the root:

```bash
cp .env.example .env
```

Ensure your PostgreSQL connection string and Redis host are configured properly:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apnaghar_db?schema=public"
REDIS_URL="redis://localhost:6379"
```

### 3. PostgreSQL & PostGIS Setup

Ensure PostgreSQL has the `postgis` extension enabled:
```sql
CREATE DATABASE apnaghar_db;
\c apnaghar_db;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Prisma Migration & Seed

Run Prisma migrations and populate the initial development seed data (Colleges, Amenities, Commission Rules, System Roles):

```bash
# Generate Prisma Client
npm run prisma:generate

# Run DB migrations
npm run prisma:migrate

# (Optional) Seed development dataset
npm run prisma:seed
```

### 5. Start Backend API (`apps/api`)

```bash
# Development mode with hot reload
npm run dev:api
```
- API Server: `http://localhost:4000/api/v1`
- Swagger OpenAPI Documentation: `http://localhost:4000/api/v1/docs`
- Health Check: `http://localhost:4000/api/v1/health`

### 6. Start Frontend App (`apps/web`)

```bash
# Development server
npm run dev:web
```
- Web Application: `http://localhost:3000`

---

## 🧪 Testing

```bash
# Run unit & integration tests
npm run test:api

# Run concurrency tests (1 Bed Remaining Race Condition)
npm run test:api -- test/booking-concurrency.spec.ts
```

---

## 📚 Technical Documentation Index

Detailed engineering blueprints are maintained in the [`docs/`](./docs) folder:
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System topology, modular monolith boundaries, and tech stack rationale.
- [`docs/DATABASE.md`](./docs/DATABASE.md) — 38-entity ER diagram, indexing strategy, and PostGIS spatial queries.
- [`docs/API.md`](./docs/API.md) — Comprehensive REST API endpoints and OpenAPI specification.
- [`docs/BOOKING_FLOW.md`](./docs/BOOKING_FLOW.md) — Booking finite state machine, Redis holds, and concurrency locks.
- [`docs/SECURITY.md`](./docs/SECURITY.md) — RBAC matrix, Argon2id encryption, OWASP defenses, and audit logging.

---

## 🛡️ License

UNLICENSED — Proprietary codebase for Apna Ghar.
