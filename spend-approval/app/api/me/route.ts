import { authenticated } from '../../../lib/http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return authenticated(request, actor => Response.json(actor));
}
