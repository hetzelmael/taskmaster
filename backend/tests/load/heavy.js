import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95) < 500'],
    http_req_failed: ['rate < 0.01'],
  },
};

const password = 'Test1234!';

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const params = { headers: { 'Content-Type': 'application/json' } };

  // Chaque VU s'enregistre avec un email unique pour éviter les collisions / rate-limit côté register
  const email = `load_vu_${__VU}_${Date.now()}@taskmaster.local`;
  const registerPayload = JSON.stringify({ firstName: 'Load', lastName: 'User', email, password });
  http.post(`${baseUrl}/api/auth/register`, registerPayload, params);

  const loginPayload = JSON.stringify({ email, password });
  const res = http.post(`${baseUrl}/api/auth/login`, loginPayload, params);
  check(res, { 'login status 200': (r) => r.status === 200 });

  // Simple GET tasks
  const token = res.status === 200 ? JSON.parse(res.body).token : null;
  if (token) {
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const r = http.get(`${baseUrl}/api/tasks`, headers);
    check(r, { 'tasks list 200': (rr) => rr.status === 200 });
  }

  sleep(1);
}
