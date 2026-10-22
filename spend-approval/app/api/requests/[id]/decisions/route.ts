import { authenticated } from '../../../../../lib/http';
import { readJson } from '../../../../../lib/body';
import { getStore } from '../../../../../lib/store';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return authenticated(request, async actor => Response.json(getStore().decide((await context.params).id, actor, await readJson(request))));
}
