# ADR-001: MongoDB as Primary Database with Mongoose ODM

## Status
Accepted

## Context
The platform requires rich document schemas for student properties, varied room types, bed-level inventories, 7-point verification checklists, and high-performance geospatial queries anchored by universities (`[longitude, latitude]`).

## Decision
We select MongoDB with Mongoose ODM as the primary and permanent datastore for Apna Ghar.
- MongoDB GeoJSON Point format and `2dsphere` indexes will power all proximity search queries (`$geoNear`).
- Multi-document ACID transactions will be used during booking confirmation to guarantee consistency when transitioning bed status.
- Relational databases (PostgreSQL, MySQL, SQLite) and Prisma are explicitly excluded per architectural standard.

## Consequences
- Requires strict Mongoose schema validation, index management, and defensive DTO typing.
- All coordinates must adhere strictly to `[longitude, latitude]` array syntax.
