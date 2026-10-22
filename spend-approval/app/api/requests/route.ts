import { authenticated } from '../../../lib/http';
import { readJson } from '../../../lib/body';
import { configuredReviewers, getStore } from '../../../lib/store';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return authenticated(request, actor => Response.json(getStore().list(actor)));
}
export async function POST(request: Request) {
  return authenticated(request, async actor => Response.json(getStore().create(actor, await readJson(request), configuredReviewers()), { status: 201 }));
}
