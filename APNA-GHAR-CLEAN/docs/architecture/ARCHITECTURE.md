# Apna Ghar System Architecture Specification

## 1. High-Level Architecture Overview
Apna Ghar is designed as a high-performance modular monolith with strict separation of concerns across the presentation, application, cache, and datastore layers.

```
+-------------------------------------------------------------+
|              Next.js 15 App Router Frontend                 |
|  (Public Marketplace / Student Portal / Owner / Mess Ops)   |
+-------------------------------------------------------------+
                              |  HTTP / REST (JSON API)
                              v
+-------------------------------------------------------------+
|              NestJS 10 Modular Monolith API                 |
|   (Auth, GeoSearch, Inventory, Verification, Bookings)      |
+-------------------------------------------------------------+
         |                                           |
         v                                           v
+------------------------+              +------------------------+
|   Redis Distributed    |              |  MongoDB Replica Set   |
|   Cache & Bed Holds    |              |  (Permanent Datastore, |
|  (8-min TTL Atomic)    |              |   2dsphere Geo Indexes)|
+------------------------+              +------------------------+
```

## 2. Inventory & Concurrency Model
1. **Hierarchy:** Property $\to$ RoomType $\to$ Room $\to$ Bed.
2. **Bed Holding:** When a student enters checkout, an atomic Redis `SET booking:hold:{bedId} {payload} EX 480 NX` lock is acquired.
3. **Double-Booking Prevention:** Redis rejects concurrent attempts with `HTTP 409 Conflict` (`BED_NOT_AVAILABLE`).
4. **Final Confirmation:** A MongoDB multi-document ACID transaction transitions bed permanent state to `BOOKED`, creates the permanent `Booking` record, records the `Payment`, and safely deletes the Redis hold.

## 3. Geospatial Indexing
- Stored as GeoJSON `Point`: `{ type: "Point", coordinates: [longitude, latitude] }`.
- Index: `2dsphere` on `colleges.location` and `properties.location`.
- Query: `$geoNear` aggregation pipeline computes exact spherical distance in meters.
