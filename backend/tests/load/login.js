import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '5s',
};

const email = 'loadtest@taskmaster.dev';
const password = 'Test1234!';

export default function () {
  const params = { headers: { 'Content-Type': 'application/json' } };
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  if (__ITER === 0) {
    const registerPayload = JSON.stringify({
      firstName: 'Load',
      lastName: 'Test',
      email,
      password,
    });
    http.post(`${baseUrl}/api/auth/register`, registerPayload, params);
  }

  const loginPayload = JSON.stringify({ email, password });
  const res = http.post(`${baseUrl}/api/auth/login`, loginPayload, params);
  check(res, { 'login status 200': (r) => r.status === 200 });
  sleep(1);
}
