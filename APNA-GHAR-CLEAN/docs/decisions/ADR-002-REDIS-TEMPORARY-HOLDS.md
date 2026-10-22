# ADR-002: Redis for Temporary Bed Reservation Holds

## Status
Accepted

## Context
When a student selects an exact bed to book, they need a guaranteed window (e.g., 8 minutes) to review costs, input emergency contacts, and complete payment without another student taking the same bed concurrently. Using disk-based database writes with frequent polling can create write contention and race conditions.

## Decision
We utilize Redis as an ephemeral distributed lock and cache layer:
- Key pattern: `booking:hold:{bedId}`
- Atomic acquisition via `SET key value EX ttl NX`. If two students attempt the same bed at the same millisecond, Redis guarantees only one receives OK (201); the second receives an HTTP 409 Conflict (`BED_NOT_AVAILABLE`).
- Atomic release via a verified Lua script ensuring only the holding session can remove the key early.
- Redis is strictly for temporary state and rate-limiting, never permanent record persistence.

## Consequences
- Requires Redis connection lifecycle management and automatic fallback to compatible in-memory locks for local offline test runs.
