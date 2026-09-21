# APNA GHAR — DATABASE ARCHITECTURE & POSTGIS SPECIFICATION
**Engine:** PostgreSQL 16  
**Extensions:** `postgis`  
**ORM:** Prisma ORM  

---

## 1. Domain Entity Modeling Principles

1. **Normalized 3NF Structure:** Data redundancy is eliminated. For example, property amenities are modeled via a junction table `PropertyAmenity` connecting `Property` to `Amenity`.
2. **Central User with Role Polymorphism:** Central `User` manages authentication and RBAC; distinct 1:1 profiles (`StudentProfile`, `OwnerProfile`, `FoodPartnerProfile`) store domain-specific details.
3. **Hierarchical Inventory Model:**
   ```
   Property (1:N) RoomType (1:N) Room (1:N) Bed
   ```
   Availability is never modeled as a naive boolean flag on `Property`. It is calculated dynamically from atomic `Bed.status`:
   - `AVAILABLE`
   - `TEMPORARILY_HELD`
   - `RESERVED`
   - `OCCUPIED`
   - `MAINTENANCE`
   - `INACTIVE`
4. **Verified Reviews Guarantee:** Every `Review` requires a unique `bookingId` reference pointing to a verified booking with status `CHECKED_IN` or `COMPLETED`.

---

## 2. PostGIS Spatial Search Strategy

### Schema Extension & Spatial Indexing
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Geometry column with WGS 84 spatial reference system (SRID 4326)
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "location" geometry(Point, 4326);

-- GiST Spatial Index for rapid logarithmic boundary lookups
CREATE INDEX IF NOT EXISTS "idx_addresses_location_gist" ON "addresses" USING GIST ("location");

-- Spatial Index for Colleges
ALTER TABLE "colleges" ADD COLUMN IF NOT EXISTS "location" geometry(Point, 4326);
CREATE INDEX IF NOT EXISTS "idx_colleges_location_gist" ON "colleges" USING GIST ("location");
```

### Proximity Calculation Query
```sql
SELECT 
  p.id,
  p.name,
  p.slug,
  p."propertyType",
  p."genderPreference",
  ROUND((ST_DistanceSphere(a.location, c.location) / 1000)::numeric, 2) AS distance_km,
  MIN(rt."baseRent") AS min_rent,
  COUNT(b.id) FILTER (WHERE b.status = 'AVAILABLE') AS available_beds
FROM properties p
JOIN addresses a ON a."propertyId" = p.id
JOIN colleges c ON c.id = $1::uuid
JOIN room_types rt ON rt."propertyId" = p.id
JOIN rooms r ON r."roomTypeId" = rt.id
JOIN beds b ON b."roomId" = r.id
WHERE p.status = 'ACTIVE'
  AND p."isVerified" = true
  AND p."deletedAt" IS NULL
  AND ST_DWithin(a.location, c.location, $2 * 1000) -- Radius in meters
GROUP BY p.id, a.id, c.id
ORDER BY distance_km ASC;
```

---

## 3. Concurrency & Locking Strategy

### Double-Booking Prevention
When acquiring a bed hold during checkout:
```sql
-- Executed inside a READ COMMITTED transaction
SELECT id, status, "holdExpiresAt", version 
FROM beds 
WHERE id = $1::uuid 
FOR UPDATE;

-- Backend checks: 
-- (status = 'AVAILABLE') OR (status = 'TEMPORARILY_HELD' AND "holdExpiresAt" < NOW())

UPDATE beds 
SET status = 'TEMPORARILY_HELD',
    "currentBookingId" = $2,
    "holdExpiresAt" = NOW() + INTERVAL '15 minutes',
    version = version + 1,
    "updatedAt" = NOW()
WHERE id = $1::uuid;
```
If another transaction attempts to select the same bed simultaneously, PostgreSQL row-level locks hold the second transaction until the first commits or rolls back, at which point the second transaction observes `status = 'TEMPORARILY_HELD'` and immediately returns `409 Conflict`.
