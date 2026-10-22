import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson } from '../lib/body.ts';

function request(body: string, contentType = 'application/json') {
  return new Request('http://test/api', { method: 'POST', headers: { 'content-type': contentType }, body });
}
test('JSON boundary accepts valid JSON and rejects wrong media types or malformed JSON', async () => {
  assert.deepEqual(await readJson(request('{"title":"Example"}')), { title: 'Example' });
  await assert.rejects(readJson(request('{}', 'text/plain')), { status: 422 });
  await assert.rejects(readJson(request('{')), { status: 422 });
  await assert.rejects(readJson(request('')), { status: 422 });
});
test('JSON boundary rejects a large chunked body regardless of a missing content-length', async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(' '.repeat(5000))); controller.enqueue(new TextEncoder().encode(' '.repeat(5000))); controller.close(); } });
  const input = new Request('http://test/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' } as RequestInit);
  await assert.rejects(readJson(input), { status: 422 });
});
