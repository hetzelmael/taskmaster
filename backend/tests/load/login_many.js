import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
  thresholds: { http_req_failed: ['rate < 0.01'] },
};

export default function () {
  const base = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const email = `load_vu_${__VU}@taskmaster.local`;
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(
    `${base}/api/auth/login`,
    JSON.stringify({ email, password: 'Test1234!' }),
    params
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  const token = res.status === 200 ? JSON.parse(res.body).token : null;
  if (token) {
    const r = http.get(`${base}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    check(r, { 'tasks 200': (rr) => rr.status === 200 });
  }
  sleep(1);
}
