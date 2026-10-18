# ADR-006: Locked Full-Stack Feature Definition of Done

## Status
Accepted

## Context
A frontend screen cannot be considered complete merely because visual components have been styled.

## Decision
Every feature slice must strictly adhere to the locked development formula:
`REQUIREMENT`
$\to$ `ARCHITECTURE`
$\to$ `MONGODB MODEL`
$\to$ `DATABASE INDEXES`
$\to$ `API CONTRACT`
$\to$ `NESTJS BACKEND`
$\to$ `NEXT.JS FRONTEND`
$\to$ `REAL API INTEGRATION`
$\to$ `VALIDATION`
$\to$ `ERROR HANDLING`
$\to$ `TESTING`
$\to$ `REFACTOR`
$\to$ `FEATURE COMPLETE`.
