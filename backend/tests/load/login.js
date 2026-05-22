import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '20s',
};

export default function () {
  const payload = JSON.stringify({ email: 'demo@taskmaster.dev', password: 'Test1234!' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post('http://127.0.0.1:3000/api/auth/login', payload, params);
  check(res, { 'login status 200': (r) => r.status === 200 });
  sleep(1);
}
