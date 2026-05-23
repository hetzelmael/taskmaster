import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate < 0.01'],
    http_req_duration: ['p(95) < 500'],
  },
};

const password = 'Test1234!';

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const params = { headers: { 'Content-Type': 'application/json' } };

  const email = `load_vu_${__VU}@taskmaster.local`;
  if (__ITER === 0) {
    const registerPayload = JSON.stringify({
      firstName: 'Load',
      lastName: 'User',
      email,
      password,
    });
    http.post(`${baseUrl}/api/auth/register`, registerPayload, params);
  }

  const loginPayload = JSON.stringify({ email, password });
  const res = http.post(`${baseUrl}/api/auth/login`, loginPayload, params);
  check(res, { 'login status 200': (r) => r.status === 200 });

  if (res.status === 200) {
    const token = JSON.parse(res.body).token;
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const r = http.get(`${baseUrl}/api/tasks`, headers);
    check(r, { 'tasks list 200': (rr) => rr.status === 200 });
  }

  sleep(1);
}
