'use client';

/**
 * Browser calls to the device relay (/api/devices/**). Two callers share this file:
 * the /pair page acts as a user (X-Harmoniser-Token), the /device page acts as a device
 * (Authorization: Bearer <device token>). See docs/device-relay.md.
 */

import type { Action, Capsule, DeviceState } from '@/lib/devices/capsule';
import type { DeviceSummary, PollAnswer, RegisterAnswer, StateAnswer } from '@/lib/devices/relay';

import type { ApiFailure, ApiResult } from './api';

export type RelayResult<T> = ApiResult<T> & { status: number };

async function call<T>(path: string, init: RequestInit, credentials: Record<string, string>): Promise<RelayResult<T>> {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(credentials)) {
    headers.set(name, value);
  }
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
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
      return { ok: false, failure, status: response.status };
    }
    return { ok: true, data: parsed as T, status: response.status };
  } catch {
    return { ok: false, failure: { code: 'offline', message: 'The relay is unreachable right now.' }, status: 0 };
  }
}

const asUser = (token: string) => ({ 'X-Harmoniser-Token': token });
const asDevice = (token: string) => ({ Authorization: `Bearer ${token}` });
const device = (id: string) => `/api/devices/${encodeURIComponent(id)}`;
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

// ---- as a user ----

export function claimDevice(token: string, code: string): Promise<RelayResult<{ id: string; kind: string }>> {
  return call('/api/devices/claim', post({ code }), asUser(token));
}

export function listDevices(token: string): Promise<RelayResult<{ devices: DeviceSummary[] }>> {
  return call('/api/devices', { method: 'GET' }, asUser(token));
}

export function sendCapsule(token: string, id: string, capsule: Capsule): Promise<RelayResult<{ version: number }>> {
  return call(`${device(id)}/capsule`, { method: 'PUT', body: JSON.stringify(capsule) }, asUser(token));
}

export function sendAction(token: string, id: string, action: Action): Promise<RelayResult<{ action_seq: number }>> {
  return call(`${device(id)}/action`, post({ action }), asUser(token));
}

export function readDeviceState(token: string, id: string): Promise<RelayResult<StateAnswer>> {
  return call(`${device(id)}/state`, { method: 'GET' }, asUser(token));
}

export function unpairDevice(token: string, id: string): Promise<RelayResult<null>> {
  return call(device(id), { method: 'DELETE' }, asUser(token));
}

// ---- as a device ----

export function registerDevice(hw: string): Promise<RelayResult<RegisterAnswer>> {
  return call('/api/devices/register', post({ hw, kind: 'web', fw: 'web-1' }), {});
}

export function pollDevice(id: string, token: string): Promise<RelayResult<PollAnswer>> {
  return call(`${device(id)}/capsule`, { method: 'GET' }, asDevice(token));
}

export function reportDevice(id: string, token: string, state: DeviceState): Promise<RelayResult<null>> {
  return call(`${device(id)}/state`, post(state), asDevice(token));
}
