'use client';

import type { CapsuleDetailDto, CapsuleListDto, PublishResponseDto } from '../types';

export interface ApiFailure {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; failure: ApiFailure };

async function request<T>(
  path: string,
  init: RequestInit,
  token?: string,
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (token !== undefined) {
    headers.set('X-Harmoniser-Token', token);
  }
  try {
    const response = await fetch(path, { ...init, headers, cache: 'no-store' });
    const text = await response.text();
    const parsed: unknown = text.length > 0 ? JSON.parse(text) : null;
    if (!response.ok) {
      const failure = (parsed as { error?: ApiFailure } | null)?.error ?? {
        code: `http_${response.status}`,
        message: `The request failed (${response.status}).`,
      };
      return { ok: false, failure };
    }
    return { ok: true, data: parsed as T };
  } catch {
    return { ok: false, failure: { code: 'offline', message: 'The marketplace is unreachable right now.' } };
  }
}

export function fetchCapsules(params: { q?: string; tag?: string; cursor?: string | null; limit?: number }): Promise<ApiResult<CapsuleListDto>> {
  const search = new URLSearchParams();
  if (params.q !== undefined && params.q.trim().length > 0) {
    search.set('q', params.q.trim());
  }
  if (params.tag !== undefined && params.tag.length > 0) {
    search.set('tag', params.tag);
  }
  if (params.cursor !== undefined && params.cursor !== null) {
    search.set('cursor', params.cursor);
  }
  if (params.limit !== undefined) {
    search.set('limit', String(params.limit));
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return request<CapsuleListDto>(`/api/capsules${suffix}`, { method: 'GET' });
}

export function fetchCapsule(id: string): Promise<ApiResult<CapsuleDetailDto>> {
  return request<CapsuleDetailDto>(`/api/capsules/${encodeURIComponent(id)}`, { method: 'GET' });
}

export function publishCapsule(
  token: string,
  envelope: { capsule: unknown; name?: string; description?: string; tags?: string[] },
): Promise<ApiResult<PublishResponseDto>> {
  return request<PublishResponseDto>(
    '/api/capsules',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    },
    token,
  );
}

export function countInstall(id: string, token: string): Promise<ApiResult<{ ok: boolean; counted: boolean; installs: number }>> {
  return request(`/api/capsules/${encodeURIComponent(id)}/install`, { method: 'POST' }, token);
}

export function reportCapsule(
  id: string,
  token: string,
  reason: string,
): Promise<ApiResult<{ ok: boolean; counted: boolean; hidden: boolean }>> {
  return request(
    `/api/capsules/${encodeURIComponent(id)}/report`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
    token,
  );
}

export function deleteCapsule(id: string, token: string): Promise<ApiResult<{ ok: boolean; id: string }>> {
  return request(`/api/capsules/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);
}

export function failureText(failure: ApiFailure): string {
  if (failure.code === 'invalid_capsule' && Array.isArray(failure.details)) {
    return (failure.details as string[]).slice(0, 3).join(' ');
  }
  return failure.message;
}
