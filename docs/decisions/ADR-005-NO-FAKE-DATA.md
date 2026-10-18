# ADR-005: Strict No-Fake-Data Policy

## Status
Accepted

## Context
Hardcoded mock arrays (e.g. `const properties = [...]`) create illusions of functionality while obscuring real integration bugs, missing database indexes, and network latency problems.

## Decision
No application screen in production code may depend on fake or hardcoded mock data.
- If no real record exists in MongoDB, render a designed **Empty State** (e.g., *"No verified properties found near this campus yet"*).
- Fake/mock data is strictly prohibited in runtime code and allowed exclusively inside unit test files (`*.spec.ts`, `*.test.tsx`) or test fixtures.
