/**
 * Client IP for rate-limit buckets, using the verified proxy contract:
 * Vercel appends the connecting address to X-Forwarded-For, so the last entry is the one the
 * platform saw. A client-supplied X-Real-IP is only trusted when the platform sets it, so we
 * prefer X-Forwarded-For and fall back to X-Real-IP. Callers must fail closed for writes when
 * this returns null rather than sharing an empty-IP bucket.
 */

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null) {
    const parts = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  const real = request.headers.get('x-real-ip')?.trim();
  return real !== undefined && real.length > 0 ? real : null;
}
