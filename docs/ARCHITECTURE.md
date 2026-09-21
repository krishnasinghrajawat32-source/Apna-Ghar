# APNA GHAR — ARCHITECTURE SPECIFICATION
**Tagline:** *"Har Safar, Apna Ghar"*  
**System Type:** Modular Monolith API + Next.js Server Components Frontend  

---

## 1. High-Level Topology

Apna Ghar decouples presentation, domain logic, and data layers cleanly:

```
[Browser / Mobile Clients]
         │
    HTTPS Requests
         ▼
[Cloudflare Edge / Reverse Proxy]
         │
         ▼
[NestJS Modular API Gateway: /api/v1/]
  ├── Auth & RBAC Interceptors
  ├── Domain Modules (Properties, Bookings, Payments, Food)
  └── Global Filters & Pipes
         │
   ┌─────┴─────────────────────────┐
   ▼                               ▼
[Prisma ORM Client]          [Redis Client (ioredis)]
   │                               │
   ▼                               ▼
[PostgreSQL 16 + PostGIS]     [Distributed Locks & TTL Holds]
```

### Invariant Rules
1. **Frontend Isolation:** The Next.js frontend has zero direct connection or credentials for PostgreSQL or Redis. All data modifications require authenticated REST requests to `/api/v1/`.
2. **Authority of Truth:** PostgreSQL is the sole authoritative source of truth. Redis acts purely as a transient cache, sliding-window rate limiter, and distributed synchronization lock.
3. **No Distributed Microservices Complexity:** The application runs as a modular monolith. Shared domain concepts reside in clearly bounded modules that can be isolated into independent microservices in the future without schema restructuring.

---

## 2. Technology Stack Justification

| Technology | Role | Choice Justification |
| :--- | :--- | :--- |
| **Next.js 15 (App Router)** | Web Client | Zero-bundle React Server Components, fast server-side rendering for campus search pages, automatic image optimization for photo galleries. |
| **NestJS (Express Engine)** | Backend API Framework | Strict enterprise dependency injection, modular encapsulation, built-in validation pipes, native Swagger OpenAPI generation. |
| **PostgreSQL 16** | Core Relational DB | ACID transaction support, row-level locks (`FOR UPDATE`), foreign keys, check constraints, JSONB flexibility. |
| **PostGIS Extension** | Spatial Search Engine | Native spherical distance calculations (`ST_DWithin`, `ST_DistanceSphere`) utilizing spatial `GiST` indexes. |
| **Prisma ORM** | Data Access Layer | End-to-end type safety, auto-generated migration management, atomic client transactions. |
| **Redis 7** | Cache & Lock Manager | Microsecond performance for temporary inventory holds (15-minute TTL), token blacklist revocation, and Redlock mutual exclusion. |

---

## 3. Modular Monolith Decomposition

Each module in `apps/api/src/modules/` maintains its own Controllers, Services, DTOs, and Interfaces:

- `auth`: Central user registration, Argon2id password verification, JWT generation, cookie issuing.
- `users`: User entity queries, status updates, and soft-delete routines.
- `profiles`: Student, Owner, and Food Partner profile management.
- `colleges`: University geolocation, landmark boundaries, and college slug resolution.
- `properties`: Property catalog, amenities mapping, house rules, and room types.
- `inventory`: Room hierarchy and atomic Bed status tracking.
- `search`: PostGIS radius search, multi-facet filtering, and sorting.
- `verification`: Private document upload, admin inspection, and status transitions.
- `visits`: Student visit scheduling, owner acceptance, and rescheduling.
- `bookings`: Finite state machine, inventory reservation, and tenure management.
- `locks`: Redis distributed lock and bed temporary hold coordinator.
- `payments`: Indian payment gateway abstraction (Razorpay / Cashfree) and webhook receiver.
- `refunds`: Configurable cancellation policy evaluation and refund dispatch.
- `disputes`: Grievance submission, evidence collection, and admin arbitration.
- `food`: Mess kitchen profiles, daily menus, meal plans, food orders, and meal subscriptions.
- `cost-calculator`: Transparent monthly living cost calculation.
- `recommendations`: Multi-factor explainable recommendation scoring.
- `reviews`: Verified stay reviews and multi-category ratings.
- `messages`: WebSocket / Socket.IO real-time chat between students and owners.
- `notifications`: In-app notification dispatcher with email/SMS hooks.
- `admin`: Platform-wide governance, moderation, and take-rate commission settings.
- `audit`: Immutable historical audit logs for sensitive operations.
