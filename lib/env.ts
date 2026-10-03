/** Environment helpers. Everything is read lazily so `next build` works without secrets. */

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable ${name}`);
    this.name = 'MissingEnvError';
  }
}

export function envValue(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v.trim() === '' ? undefined : v.trim();
}

export function requireEnv(name: string): string {
  const v = envValue(name);
  if (v === undefined) {
    throw new MissingEnvError(name);
  }
  return v;
}

/** Exact browser origins allowed to make mutating requests, from ALLOWED_ORIGINS. */
export function allowedOrigins(): string[] {
  const raw = envValue('ALLOWED_ORIGINS');
  if (raw === undefined) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, '').toLowerCase())
    .filter((s) => s.length > 0);
}

export function siteUrl(): string {
  return envValue('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000';
}

/** A short label for the validator revision stored on every published capsule. */
export const VALIDATOR_REVISION = envValue('VALIDATOR_REVISION') ?? 'web-0.1.0';
