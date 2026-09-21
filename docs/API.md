# APNA GHAR — API CONTRACT & SPECIFICATION
**Version:** v1 (`/api/v1/`)  
**Standard Documentation:** OpenAPI 3.0 via Swagger (`/api/v1/docs`)  

---

## 1. Response Standard Envelope

### Standard Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully.",
  "meta": {
    "timestamp": "2026-09-18T17:45:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### Standard Error Response (RFC 7807)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_ENUM",
    "message": "Human-readable explanation of error.",
    "details": []
  },
  "meta": {
    "timestamp": "2026-09-18T17:45:00.000Z",
    "requestId": "req_123456789"
  }
}
```

---

## 2. Core API Endpoint Routes

### Authentication (`/api/v1/auth`)
- `POST /register` — Body: `{ email, password, role: "STUDENT"|"OWNER"|"FOOD_PARTNER", firstName, lastName, ... }`
- `POST /login` — Body: `{ email, password }` $\to$ Returns JWT access token + Sets HTTP-only `refreshToken` cookie.
- `POST /logout` — Clears HTTP-only cookie and deletes session in Redis.
- `POST /refresh` — Validates refresh token cookie, rotates token, returns new access token.
- `POST /forgot-password` — Body: `{ email }`
- `POST /reset-password` — Body: `{ token, newPassword }`

### Properties & Search (`/api/v1/properties`)
- `GET /` — Query params: `collegeId`, `latitude`, `longitude`, `radiusKm`, `minRent`, `maxRent`, `gender`, `sharingType`, `furnishing`, `verifiedOnly`, `sort`.
- `GET /:id` — Public property details, rooms, bed availability, 360 viewer metadata, amenities.
- `POST /owner/properties` — Create draft property (Requires `OWNER` role).
- `PATCH /owner/properties/:id` — Update property details (Requires `OWNER` role).
- `POST /owner/properties/:id/verification` — Submit ownership deed / electricity bill (Requires `OWNER` role).

### Rooms & Inventory (`/api/v1/owner`)
- `POST /properties/:id/room-types` — Add room type (Requires `OWNER` role).
- `POST /room-types/:id/rooms` — Add room with bed count (Requires `OWNER` role).
- `PATCH /beds/:id/status` — Mark bed maintenance / inactive (Requires `OWNER` role).

### Visits (`/api/v1/visits`)
- `POST /` — Request property visit (Requires `STUDENT` role).
- `GET /` — List visits for logged-in user.
- `PATCH /:id/status` — Confirm, reschedule, or cancel visit.

### Bookings & Holds (`/api/v1/bookings`)
- `POST /` — Initiate booking request (Requires `STUDENT` role).
- `PATCH /:id/approve` — Owner approves request (Requires `OWNER` role).
- `POST /:id/hold` — Acquire atomic temporary inventory hold (15-minute TTL).
- `GET /:id` — Fetch booking status, payment breakdown, and check-in status.
- `PATCH /:id/cancel` — Cancel booking subject to policy rules.

### Payments (`/api/v1/payments`)
- `POST /order` — Create Razorpay/Cashfree order for booking amount.
- `POST /webhook` — Public webhook receiver; validates HMAC SHA-256 signature; updates payment & booking atomically.

### Food Marketplace (`/api/v1/food-partners`)
- `GET /` — Discover kitchens within radius.
- `GET /:id/menu` — View active menu items and meal plans.
- `POST /orders` — Place on-demand food order.
- `POST /subscriptions` — Subscribe to daily/weekly/monthly meal plan.

### Recommendations (`/api/v1/recommendations`)
- `GET /` — Returns personalized properties with explainable match scores and rationale arrays.
