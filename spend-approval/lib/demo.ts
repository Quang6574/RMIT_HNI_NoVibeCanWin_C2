import { DEMO_IDENTITIES } from '../lib-ui/demo-identities.ts';
import { HttpError } from './rules.ts';
import type { Actor } from './rules.ts';

export function demoEnabled(): boolean {
  return process.env.SPEND_DEMO_MODE === '1' && process.env.NODE_ENV !== 'production';
}

export function demoActor(request: Request): Actor {
  if (!demoEnabled()) throw new HttpError(401, 'Local simulation is disabled.');
  const url = new URL(request.url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.port !== '3001' ||
      (request.headers.has('origin') && request.headers.get('origin') !== url.origin)) {
    throw new HttpError(403, 'Simulation is restricted to the local demo on port 3001.');
  }
  const actor = DEMO_IDENTITIES.find(item => item.sub === request.headers.get('x-spend-demo-identity'));
  if (!actor || request.headers.has('authorization')) throw new HttpError(401, 'Select one of the four demo identities.');
  return { ...actor, roles: [...actor.roles] };
}
