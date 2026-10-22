import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { verifyClaims, actorFromClaims } from '../lib/auth.ts';

// Ephemeral test key, supplied only to the verifier under test; never an app login path.
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const config = { realm: 'test', resource: 'spend-client', 'auth-server-url': 'https://issuer.example/', jwk: { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'unit-test', alg: 'EdDSA', use: 'sig' }] } };
function jwt(overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', kid: 'unit-test', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ iss: 'https://issuer.example/realms/test', azp: 'spend-client', aud: 'spend-client', sub: 'synthetic-user', exp: Math.floor(Date.now() / 1000) + 60, ...overrides })).toString('base64url');
  const data = `${header}.${body}`;
  return `${data}.${sign(null, Buffer.from(data), privateKey).toString('base64url')}`;
}
test('real signature verification accepts the expected issuer, client, audience and lifetime', async () => {
  const claims = await verifyClaims(config, jwt({ preferred_username: 'Example', realm_access: { roles: ['spend_requester'] }, resource_access: { 'spend-client': { roles: ['spend_requester'] }, other: { roles: ['spend_ceo_reviewer'] } } }));
  assert.ok(claims);
  assert.deepEqual(actorFromClaims(claims, config.resource), { sub: 'synthetic-user', displayName: 'Example', roles: ['spend_requester'] });
  assert.ok(await verifyClaims(config, jwt({ aud: ['other', 'spend-client'] })));
});
test('missing, malformed, expired, wrong issuer, wrong client and wrong audience tokens are rejected', async () => {
  for (const token of ['', 'invalid', jwt({ exp: 1 }), jwt({ exp: undefined }), jwt({ iss: 'https://attacker.example/realms/test' }), jwt({ azp: 'other-client' }), jwt({ aud: 'other-api' }), jwt({ aud: undefined }), jwt({ sub: undefined })]) {
    assert.equal(await verifyClaims(config, token), null);
  }
});
test('tampered signatures, attacker signing keys and unapproved algorithms are rejected', async () => {
  const parts = jwt().split('.');
  parts[2] = Buffer.alloc(64).toString('base64url');
  assert.equal(await verifyClaims(config, parts.join('.')), null);
  const other = generateKeyPairSync('ed25519');
  const attackerConfig = { ...config, jwk: { keys: [{ ...other.publicKey.export({ format: 'jwk' }), kid: 'unit-test', alg: 'EdDSA' }] } };
  assert.equal(await verifyClaims(attackerConfig, jwt()), null);
  parts[0] = Buffer.from(JSON.stringify({ alg: 'HS256', kid: 'unit-test' })).toString('base64url');
  assert.equal(await verifyClaims(config, parts.join('.')), null);
});
