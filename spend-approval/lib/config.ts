import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HttpError } from './rules.ts';
import type { VerificationConfig } from './auth.ts';

export function getTideConfig(): VerificationConfig {
  try {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'tidecloak.json'), 'utf8'));
    if (!config || ['realm', 'resource', 'auth-server-url'].some(key => typeof config[key] !== 'string' || !config[key].trim())) throw new Error('Invalid config');
    return config;
  } catch {
    throw new HttpError(503, 'Live Tide configuration is missing or invalid. Download tidecloak.json for this client.');
  }
}
