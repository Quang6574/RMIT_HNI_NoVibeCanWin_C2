import { HttpError, isHttpError } from './rules.ts';

export async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(422, 'Send an application/json body.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(422, 'A JSON body is required.');
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 8192) { await reader.cancel(); throw new HttpError(422, 'Request body exceeds 8 KB.'); }
      parts.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (isHttpError(error)) throw error;
    throw new HttpError(422, 'Invalid JSON body.');
  } finally { reader.releaseLock(); }
}
