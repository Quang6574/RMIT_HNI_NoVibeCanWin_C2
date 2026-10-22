import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoApi, createSpendApi } from '../lib-ui/api-client.ts';
import { parseAmountToMinor } from '../lib-ui/amount.ts';

test('expense form parses exact cents within server limits without rounding fractional cents', () => {
  for (const [input, expected] of [['0.01', 1], ['1.1', 110], ['1250.00', 125000], [' 1000000 ', 100000000]] as const) {
    assert.equal(parseAmountToMinor(input), expected);
  }
  for (const input of ['', '0', '-1', '.01', '1.001', '1e3', '1,000', 'NaN', 'Infinity', '1000000.01', '999999999999999999999999999999999999999999']) {
    assert.equal(parseAmountToMinor(input), null);
  }
});

test('transport requires an access token, refreshes it per call and omits cookie credentials', async t => {
  let reads = 0;
  const calls: { path: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (path: string, init: RequestInit) => {
    calls.push({ path, init });
    return Response.json({ sub: 'test-user', displayName: 'Test', roles: [] });
  });
  assert.deepEqual(await createSpendApi(async () => null).getMe(), { ok: false, code: 401, message: 'Sign in again to continue.' });
  assert.equal(calls.length, 0);
  const api = createSpendApi(async () => `test-token-${++reads}`);
  assert.equal((await api.getMe()).ok, true);
  await api.getRequest('id/with space');
  assert.equal(calls[1].path, '/api/requests/id%2Fwith%20space');
  assert.equal(calls[1].init.credentials, 'omit');
  assert.equal(calls[1].init.cache, 'no-store');
  assert.equal(new Headers(calls[1].init.headers).get('Authorization'), 'Bearer test-token-2');
  const body = { title: 'Test', amountMinor: 101, currency: 'USD', category: 'Test', businessReason: 'Test only' };
  await api.createRequest(body);
  assert.equal(calls[2].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[2].init.body as string), body);
  await api.submitDecision('id', { roleSlot: 'ceo', vote: 'reject' });
  assert.equal(calls[3].path, '/api/requests/id/decisions');
  assert.deepEqual(JSON.parse(calls[3].init.body as string), { roleSlot: 'ceo', vote: 'reject' });
});

test('transport preserves actionable API errors and catches network/non-JSON failures', async t => {
  const api = createSpendApi(async () => 'test-token');
  for (const status of [401, 403, 404, 409, 422, 503]) {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Server explanation' }, { status }));
    assert.deepEqual(await api.getMe(), { ok: false, code: status, message: 'Server explanation' });
    fetchMock.mock.restore();
  }
  const badResponse = t.mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 500 }));
  assert.equal((await api.getMe() as { code: string }).code, 'network');
  badResponse.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Network down'); });
  assert.equal((await api.getMe() as { code: string }).code, 'network');
});

test('simulation transport uses an explicit demo identity and never fabricates a bearer token', async t => {
  t.mock.method(globalThis, 'fetch', async (_path: string, init: RequestInit) => {
    const headers = new Headers(init.headers);
    assert.equal(headers.get('X-Spend-Demo-Identity'), 'demo-ceo');
    assert.equal(headers.has('Authorization'), false);
    assert.equal(init.credentials, 'omit');
    return Response.json({ sub: 'demo-ceo', roles: ['spend_ceo_reviewer'] });
  });
  assert.equal((await createDemoApi('demo-ceo').getMe()).ok, true);
});
