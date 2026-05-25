import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
};

const password = 'Test1234!';

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const params = { headers: { 'Content-Type': 'application/json' } };

  const email = `short_vu_${__VU}@taskmaster.local`;
  // register once per VU
  if (__ITER === 0) {
    const registerPayload = JSON.stringify({
      firstName: 'Short',
      lastName: 'Debug',
      email,
      password,
    });
    const r1 = http.post(`${baseUrl}/api/auth/register`, registerPayload, params);
    check(r1, { 'register 201 or 409': (res) => res.status === 201 || res.status === 409 });
  }

  const loginPayload = JSON.stringify({ email, password });
  const res = http.post(`${baseUrl}/api/auth/login`, loginPayload, params);
  check(res, { 'login 200': (r) => r.status === 200 });

  sleep(1);
}
