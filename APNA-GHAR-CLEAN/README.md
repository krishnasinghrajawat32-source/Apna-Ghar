# Apna Ghar — “Har Sahar Apna Ghar”
> **Trust-First Verified Student Living Platform**

---

## 1. Project Overview
Apna Ghar is a production-grade, trust-first student accommodation platform engineered to solve the most critical pain points in student housing:
1. **Verified Proximity:** Discovering genuine student accommodations near universities using authoritative 2dsphere geospatial queries.
2. **Apna Ghar Trust Passport:** Multi-point physical verification covering owner KYC, location verification, real room photos, genuine pricing, actual amenities, and legal documentation.
3. **Availability Freshness:** Real-time bed-level inventory tracking with strict audit timestamps to eliminate phantom vacancies.
4. **Total Living Cost Calculator:** Transparent breakdown separating fixed, variable, and estimated recurring costs (rent, food, electricity, maintenance, laundry, commute).
5. **Atomic Bed Reservation:** High-concurrency distributed bed locking backed by Redis with TTL expiration to prevent double-booking.

---

## 2. Monorepo Architecture

```
apna-ghar/
├── apps/
│   ├── web/                     # Next.js 15 (App Router, Tailwind CSS, TanStack Query, Zustand)
│   └── api/                     # NestJS 10 (Modular Monolith, Mongoose, ioredis, Argon2id)
├── packages/
│   ├── shared-types/            # Central domain entities, enums, DTO contracts
│   ├── shared-constants/        # Bed hold durations, search radii, standard error codes
│   ├── eslint-config/           # Monorepo linting standards
│   └── tsconfig/                # Strict TypeScript configurations
├── docs/
│   ├── architecture/            # Architecture specifications & diagrams
│   ├── api/                     # OpenAPI contracts & guides
│   └── decisions/               # Architecture Decision Records (ADRs)
├── .env.example                 # Centralized environment variable template
├── pnpm-workspace.yaml          # pnpm workspace configuration
└── README.md
```

---

## 3. Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React, TanStack Query v5, Zustand, React Hook Form, Zod.
- **Backend:** NestJS 10, TypeScript (Strict Mode), Mongoose 8 (ODM), ioredis, Argon2id, class-validator, Swagger OpenAPI.
- **Primary Database:** MongoDB (GeoJSON Point coordinates, 2dsphere indexes, ACID multi-document transactions).
- **Cache & Distributed Locks:** Redis (Atomic `SET NX EX` holds, Lua script release, TTL management).
- **Package Manager:** `pnpm`.

---

## 4. Prerequisites & Setup

### Prerequisites
- **Node.js:** `>= 20.0.0` (Recommended: v22.x or v24.x)
- **pnpm:** `>= 9.0.0`
- **MongoDB:** `>= 7.0` (Running locally on `127.0.0.1:27017` or MongoDB Atlas URI)
- **Redis:** `>= 6.2` (Running locally on `127.0.0.1:6379` or Redis Cloud URI; automated mock fallback included for offline local dev)

### Installation
```bash
# Clone repository and enter directory
cd "APNA GHAR PROJECT"

# Install all monorepo dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

---

## 5. Development Commands

```bash
# Run both Backend API and Frontend Web concurrently
pnpm dev

# Run only Backend API (http://localhost:4000/api/v1)
pnpm dev:api

# Run only Frontend Web (http://localhost:3000)
pnpm dev:web

# View Swagger API Docs
# Open: http://localhost:4000/api/v1/docs
```

---

## 6. Build & Quality Assurance Commands

```bash
# Typecheck all workspaces in parallel
pnpm typecheck

# Lint all workspaces
pnpm lint

# Build all packages and applications in topological order
pnpm build

# Run unit tests
pnpm test

# Format codebase
pnpm format
```

---

## 7. Strict Product & Engineering Guidelines

1. **Strict No-Fake-Data Policy:** No hardcoded mock arrays in production runtime code. If no data exists, present an informative Empty State.
2. **No Heavy 3D:** Do not use Three.js, React Three Fiber, or heavy decorative WebGL. Prioritize verified photography, floor plans, and lazy-loaded 360° panoramas.
3. **Student Journey First:** Complete the end-to-end student flow (Search $\to$ Trust Passport $\to$ Compare $\to$ Visit $\to$ Room/Bed Selection $\to$ Redis Hold $\to$ Booking) before building secondary owner/mess features.
4. **ACID Booking Guarantees:** Bed holds are temporary and atomic in Redis; finalized bookings execute as MongoDB multi-document transactions.

---

## 8. Phase Structure

- **Phase 0:** Engineering Foundation (Monorepo, Strict TypeScript, NestJS, Next.js, Mongo, Redis, Health Probe)
- **Phase 1:** Authentication + User Foundation (Argon2id, HTTP-Only Refresh, RBAC)
- **Phase 2:** College + Property Marketplace ($geoNear 2dsphere Proximity Search)
- **Phase 3:** Trust Layer (Apna Ghar Trust Passport & Availability Freshness)
- **Phase 4:** Favorites, Comparison & Parent Mode
- **Phase 5:** Visit Scheduling Workflow
- **Phase 6:** Room/Bed Selection, Redis Hold & Transactional Booking
- **Phase 7:** Property Owner Inventory Management Platform
- **Phase 8:** Mess / Tiffin Food Partner Marketplace
- **Phase 9:** Verified Media & 360° Panorama Viewer
- **Phase 10:** Production Hardening & Security Audit
