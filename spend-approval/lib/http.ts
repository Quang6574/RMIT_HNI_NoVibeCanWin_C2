import config from '../tidecloak.json';
import { actorFromClaims, verifyClaims } from './auth.ts';
import { HttpError } from './rules.ts';
import type { Actor } from './rules.ts';

export async function authenticated(request: Request, action: (actor: Actor) => Response | Promise<Response>): Promise<Response> {
  try {
    const header = request.headers.get('authorization');
    if (!header || !/^Bearer \S+$/i.test(header)) throw new HttpError(401, 'A valid bearer access token is required.');
    const claims = await verifyClaims(config, header.slice(7));
    if (!claims) throw new HttpError(401, 'Invalid or expired access token.');
    const response = await action(actorFromClaims(claims, config.resource));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    const status = error instanceof HttpError ? error.status : (error instanceof Error && 'code' in error && error.code === 'ERR_SQLITE_ERROR' && error.message.includes('locked')) ? 503 : 500;
    if (status === 500) console.error('Spending API failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: error instanceof HttpError ? error.message : status === 503 ? 'Database is busy. Retry shortly.' : 'The request could not be completed.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
