import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics to verify double-booking invariant
export const successfulBookings = new Counter('successful_bookings');
export const rejectedBookings = new Counter('rejected_bookings');
export const unexpectedErrors = new Counter('unexpected_errors');

export const options = {
  scenarios: {
    // 50 concurrent students attempt to lock and reserve the EXACT SAME solitary bed simultaneously
    bed_concurrency_race: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // Invariant: Exactly 1 booking must succeed, and 49 must be rejected with 409 Conflict
    successful_bookings: ['count==1'],
    rejected_bookings: ['count==49'],
    unexpected_errors: ['count==0'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

// Seeded target solitary bed for the concurrency experiment
const TARGET_BED_ID = __ENV.TARGET_BED_ID || '77777777-7777-4777-8777-000000000001';

export default function () {
  const vuId = __VU;

  // Generate distinct student authentication token or payload
  const payload = JSON.stringify({
    bedId: TARGET_BED_ID,
    startDate: '2026-10-01',
    endDate: '2027-04-01',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${__ENV.STUDENT_TOKEN || 'test_token'}`,
      'X-VU-ID': String(vuId),
    },
  };

  const res = http.post(`${BASE_URL}/bookings`, payload, params);

  if (res.status === 201 || res.status === 200) {
    successfulBookings.add(1);
    check(res, {
      'Solitary winner succeeded with 201': (r) => r.status === 201 || r.status === 200,
    });
  } else if (res.status === 409) {
    rejectedBookings.add(1);
    check(res, {
      'Concurrent competitors rejected with 409 Conflict': (r) => r.status === 409,
    });
  } else {
    unexpectedErrors.add(1);
    console.error(`[VU ${vuId}] Unexpected response: ${res.status} - ${res.body}`);
  }
}
