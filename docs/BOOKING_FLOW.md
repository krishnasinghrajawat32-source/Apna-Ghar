# APNA GHAR — BOOKING STATE MACHINE & CONCURRENCY ARCHITECTURE
**Tagline:** *"Har Safar, Apna Ghar"*  

---

## 1. Complete Booking Lifecycle

```
[Student selects Bed]
         │
         ▼
[1. Request Created: status=REQUESTED]
         │
         ▼
[2. Owner Review: status=OWNER_APPROVED]
         │
         ▼
[3. Atomic Inventory Hold Acquired: status=PAYMENT_PENDING]
  ├── Redis: SET hold:bed:{bedId} EX 900
  └── Postgres: Bed status=TEMPORARILY_HELD, holdExpiresAt=NOW()+15m
         │
    ┌────┴───────────────────────────┐
    ▼                                ▼
[Payment Verified]              [Timeout Exceeded]
    │                                │
    ▼                                ▼
[4. status=CONFIRMED]           [Cancel & Release Hold]
  ├── Bed status=RESERVED         ├── Bed status=AVAILABLE
  └── BookingStatusHistory logged └── Redis hold key deleted
         │
         ▼
[5. Student Check-In (OTP Verified)]
  ├── status=CHECKED_IN
  └── Bed status=OCCUPIED
         │
         ▼
[6. Stay Completed: status=COMPLETED]
```

---

## 2. Double-Booking Prevention: Concurrency Mechanics

When multiple students attempt to reserve the final bed in a property:

1. **Serialization Layer (Redis Distributed Lock):**
   - Key: `lock:bed:{bedId}`
   - Value: `studentId`
   - TTL: 5000ms
   - Guarantee: Only one thread enters the checkout execution path at a time.

2. **Authoritative ACID Lock Layer (PostgreSQL Row-Level Lock):**
   ```sql
   BEGIN TRANSACTION;
   SELECT * FROM beds WHERE id = 'target-bed-id' FOR UPDATE;
   ```
   - If the bed's status is already `TEMPORARILY_HELD` (with valid future expiration) or `RESERVED` / `OCCUPIED`, the transaction immediately throws `409 Conflict (BED_UNAVAILABLE)`.
   - If the bed is `AVAILABLE` (or has an expired hold), the status is updated to `TEMPORARILY_HELD`, `version` is incremented, and `holdExpiresAt` is set to `NOW() + 15 minutes`.
   - Transaction commits. The Redis hold key `hold:bed:{bedId}` is set for 900 seconds.

3. **Self-Healing Lazy Expiration:**
   - If a student closes their browser or fails to complete payment, the Redis hold TTL expires after 15 minutes.
   - Any subsequent query checking bed availability treats `TEMPORARILY_HELD` with `holdExpiresAt < NOW()` as effectively `AVAILABLE`.
   - A scheduled background cron task sweeps expired holds every 60 seconds and marks them `AVAILABLE` in PostgreSQL.
