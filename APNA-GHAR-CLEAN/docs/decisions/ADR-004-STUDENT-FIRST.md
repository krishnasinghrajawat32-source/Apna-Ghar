# ADR-004: Student-First Vertical Slice Development Order

## Status
Accepted

## Context
Developing features across all roles simultaneously leads to partially completed interfaces and fragmented backend services.

## Decision
The core student booking journey is prioritized before owner extras or food marketplace features:
`COLLEGE` $\to$ `SEARCH` $\to$ `VERIFY` $\to$ `COMPARE` $\to$ `VISIT` $\to$ `ROOM` $\to$ `BED` $\to$ `HOLD` $\to$ `PAYMENT` $\to$ `BOOKING` $\to$ `MOVE-IN`.

Owner onboarding and mess partner portals are built systematically in subsequent phases once the student transactional backbone is rock-solid.
