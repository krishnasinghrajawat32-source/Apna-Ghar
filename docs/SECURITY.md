# APNA GHAR — SECURITY ARCHITECTURE & RBAC MATRIX
**Tagline:** *"Har Safar, Apna Ghar"*  

---

## 1. Role-Based Access Control (RBAC) Architecture

Apna Ghar enforces strict role verification on the backend via NestJS execution interceptors. Roles cannot be elevated or bypassed via frontend state manipulation.

### Role Hierarchy & Matrix
- `STUDENT`: Can search, favorite, schedule visits, request bookings, pay, order food, raise disputes, and write reviews for verified stays.
- `OWNER`: Can create properties, define room types, add rooms and beds, accept visits, approve bookings, and view payouts.
- `FOOD_PARTNER`: Can manage daily menus, meal plans, delivery geofences, and fulfill orders.
- `ADMIN`: Global moderation, KYC/property deed verification, dispute arbitration, commission settings, and access to immutable audit logs.

### NestJS Guard Enforcement Pattern
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin/verifications')
getVerificationQueue() {
  return this.adminService.getPendingVerifications();
}
```
Attempting to access this endpoint with a `STUDENT` or `OWNER` token immediately produces `403 Forbidden`:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_INSUFFICIENT_ROLE",
    "message": "Access denied. Required role: ADMIN"
  }
}
```

---

## 2. Authentication & Credential Protection

1. **Password Hashing:**
   - Algorithm: Argon2id (`argon2`)
   - High memory and time cost prevents GPU brute-force cracking.
   - Salt generated per-user using secure cryptographically random bytes.
2. **Token Security:**
   - **Access Token:** Short lifespan (15 minutes), passed via `Authorization: Bearer <token>` header. Contains only `{ sub: userId, role: role, status: status }`.
   - **Refresh Token:** Long lifespan (7 days), stored exclusively in HTTP-only, `SameSite=Lax`, Secure cookies.
   - **Token Invalidation:** Logout deletes the active refresh token session in Redis immediately.
3. **Sensitive Document Protection:**
   - Owner KYC, PAN, Aadhaar, and property sale deeds are stored in an encrypted private S3 bucket.
   - Public APIs never expose verification storage keys or URLs.
   - Temporary 5-minute pre-signed URLs are generated exclusively on-demand for authenticated Admins reviewing verification requests.

---

## 3. OWASP Top 10 Mitigation Summary

- **Injection:** 100% parameterized queries via Prisma ORM and tagged `$queryRaw` template literals.
- **Broken Authentication:** Rate limiting on `/api/v1/auth/*` (5 req/min/IP), Argon2id, HTTP-only cookies, token family revocation.
- **Sensitive Data Exposure:** Password hashes excluded from API serialization; environment variables strictly validated on startup.
- **Security Misconfiguration:** Helmet middleware enabled; CORS restricted to configured frontend domains.
- **Logging & Monitoring:** All high-privilege operations (verifications, suspensions, refunds) logged to the `audit_logs` table.
