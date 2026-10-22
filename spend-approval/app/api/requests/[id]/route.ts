import { authenticated } from '../../../../lib/http';
import { getStore } from '../../../../lib/store';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return authenticated(request, async actor => Response.json(getStore().get((await context.params).id, actor)));
}
