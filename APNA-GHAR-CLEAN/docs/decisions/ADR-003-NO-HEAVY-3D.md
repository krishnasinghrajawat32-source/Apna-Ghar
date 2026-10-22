# ADR-003: Exclusion of Heavy 3D Graphics & WebGL

## Status
Accepted

## Context
Student housing platforms frequently suffer from slow load times on mobile devices and budget smartphones when bloated with decorative Three.js scenes, rotating 3D cards, and heavy WebGL canvas elements.

## Decision
We enforce a strict NO HEAVY 3D rule:
- Do NOT use Three.js, React Three Fiber, Babylon.js, or decorative 3D models.
- Instead, prioritize: high-resolution verified property photography, interactive floor plans, interactive maps, and lightweight, lazy-loaded 360° panoramas (using Pannellum or Marzipano).
- Ensure rapid Core Web Vitals (LCP < 2.5s, INP < 200ms) on low-end mobile hardware and cellular networks.
