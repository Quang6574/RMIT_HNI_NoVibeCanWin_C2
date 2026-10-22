import { verifyTideCloakToken } from '@tidecloak/verify';
import type { Actor } from './rules.ts';

type Claims = { sub: string; exp: number; aud: string | string[]; preferred_username?: unknown;
  realm_access?: { roles?: unknown }; resource_access?: Record<string, { roles?: unknown }>;
  vuid?: unknown; tideuserkey?: unknown };
export type VerificationConfig = { resource: string; realm: string; 'auth-server-url': string; jwk?: object };

export async function verifyClaims(config: VerificationConfig, token: string): Promise<Claims | null> {
  const claims = await verifyTideCloakToken(config, token) as Claims | null;
  // The installed SDK checks azp but not aud; require both at the resource boundary.
  if (!claims || typeof claims.sub !== 'string' || !claims.sub || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  return audiences.includes(config.resource) ? claims : null;
}
export function actorFromClaims(claims: Claims, client: string): Actor {
  const realm = claims.realm_access?.roles;
  const scoped = claims.resource_access?.[client]?.roles;
  const roles = [...(Array.isArray(realm) ? realm : []), ...(Array.isArray(scoped) ? scoped : [])]
    .filter((role): role is string => typeof role === 'string');
  return { sub: claims.sub, displayName: typeof claims.preferred_username === 'string' ? claims.preferred_username : claims.sub, roles: [...new Set(roles)] };
}
