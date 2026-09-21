import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 concurrent users
    { duration: '20s', target: 50 }, // Sustained load at 50 users
    { duration: '5s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // 95% of queries must complete in under 150ms
    http_req_duration: ['p(95)<150', 'p(99)<300'],
    http_req_failed: ['rate<0.01'], // < 1% error rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

export default function () {
  // 1. Proximity Geodesic Search around IIT Delhi
  const searchRes = http.get(
    `${BASE_URL}/search/nearby?latitude=28.5450&longitude=77.1926&radiusKm=3.0&furnishing=FULLY_FURNISHED`,
  );
  check(searchRes, {
    'Search status is 200': (r) => r.status === 200,
    'Returns matching properties': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.5);

  // 2. Explainable Recommendation Query
  const recRes = http.get(
    `${BASE_URL}/recommendations?campusSlug=iit-delhi&maxBudget=15000&amenities=wifi,ac`,
  );
  check(recRes, {
    'Recommendations status is 200': (r) => r.status === 200,
    'Returns scored recommendations with reasons': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (
          body.success === true &&
          Array.isArray(body.data) &&
          body.data.length > 0 &&
          Array.isArray(body.data[0].reasons)
        );
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.5);
}
