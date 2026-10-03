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

/**
 * The database name from a MongoDB connection string: '' when the URI has no database path,
 * or null when the URI cannot be parsed (the driver will report the real problem).
 * A path-less URI makes the driver silently use MongoDB's default `test` database, which is
 * how the 108 template capsules ended up invisible in a different database on 2026-10-03.
 */
export function databaseNameFromUri(uri: string): string | null {
  try {
    return decodeURIComponent(new URL(uri).pathname)
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/** A short label for the validator revision stored on every published capsule. */
export const VALIDATOR_REVISION = envValue('VALIDATOR_REVISION') ?? 'web-0.1.0';
