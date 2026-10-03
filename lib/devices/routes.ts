/**
 * The relay's route handlers. app/api/devices/**\/route.ts only forwards to these.
 *
 * Two kinds of caller, two credentials:
 * - a device (the board, or a /device tab): "Authorization: Bearer <device token>", issued at
 *   registration;
 * - a user (the app, or the /pair page): the site's anonymous token in X-Harmoniser-Token, as
 *   on the capsule routes. Its hashPrincipal() is the owner of every device it pairs.
 */

import type { NextResponse } from 'next/server';

import { guardIp, guardOrigin, guardToken } from '@/lib/api-guards';
import { hashPrincipal } from '@/lib/ownership';

import { failure, json, noContent, pairBaseUrl, readRelayBody, userCorsHeaders } from './http';
import type { Relay } from './relay';
import { getRelay } from './runtime';

type Handler<A extends unknown[]> = (request: Request, ...args: A) => Promise<NextResponse>;

/** A route a device calls. No CORS: the board sends no Origin and /device is same-origin. */
function deviceRoute<A extends unknown[]>(
  name: string,
  run: (relay: Relay, request: Request, ...args: A) => Promise<NextResponse>,
): Handler<A> {
  return async (request, ...args) => {
    try {
      return await run(await getRelay(), request, ...args);
    } catch (error) {
      return failure(name, error);
    }
  };
}

/** A route a user calls: allowed origin, then the anonymous token, as on the capsule routes. */
function userRoute<A extends unknown[]>(
  name: string,
  run: (relay: Relay, owner: string, request: Request, ...args: A) => Promise<NextResponse>,
): Handler<A> {
  return async (request, ...args) => {
    const blocked = guardOrigin(request);
    if (blocked !== null) {
      return blocked;
    }
    try {
      const token = guardToken(request);
      if (!token.ok) {
        return token.response;
      }
      return await run(await getRelay(), hashPrincipal(token.value), request, ...args);
    } catch (error) {
      return failure(name, error, userCorsHeaders(request));
    }
  };
}

// ---- device side ----

/** POST /api/devices/register */
export const register = deviceRoute('register', async (relay, request) => {
  // The board sends no Origin and /device is same-origin: a page on another site may not
  // register devices (and so reset someone's device, or use up the limit) from a browser.
  const blocked = guardOrigin(request);
  if (blocked !== null) {
    return blocked;
  }
  const ip = guardIp(request);
  if (!ip.ok) {
    return ip.response;
  }
  const body = await readRelayBody(request);
  return json(201, await relay.register(body, pairBaseUrl(request), ip.value));
});

/** GET /api/devices/{id}/capsule */
export const pollCapsule = deviceRoute('poll', async (relay, request, id: string) => {
  const device = await relay.authenticateDevice(id, request.headers.get('authorization'));
  return json(200, await relay.poll(device, pairBaseUrl(request)));
});

/** POST /api/devices/{id}/state */
export const reportState = deviceRoute('report', async (relay, request, id: string) => {
  // 401 before the body is looked at.
  const device = await relay.authenticateDevice(id, request.headers.get('authorization'));
  await relay.report(device, await readRelayBody(request));
  return noContent();
});

// ---- user side ----

/** POST /api/devices/claim */
export const claim = userRoute('claim', async (relay, owner, request) => {
  const ip = guardIp(request);
  if (!ip.ok) {
    return ip.response;
  }
  const body = await readRelayBody(request);
  return json(200, await relay.claim(owner, ip.value, body), userCorsHeaders(request));
});

/** GET /api/devices */
export const list = userRoute('list', async (relay, owner, request) =>
  json(200, await relay.list(owner), userCorsHeaders(request)),
);

/** PUT /api/devices/{id}/capsule */
export const putCapsule = userRoute('capsule', async (relay, owner, request, id: string) =>
  json(200, await relay.putCapsule(owner, id, await readRelayBody(request)), userCorsHeaders(request)),
);

/** POST /api/devices/{id}/action */
export const postAction = userRoute('action', async (relay, owner, request, id: string) =>
  json(200, await relay.postAction(owner, id, await readRelayBody(request)), userCorsHeaders(request)),
);

/** GET /api/devices/{id}/state */
export const getState = userRoute('state', async (relay, owner, request, id: string) =>
  json(200, await relay.getState(owner, id), userCorsHeaders(request)),
);

/** DELETE /api/devices/{id} */
export const unpair = userRoute('unpair', async (relay, owner, request, id: string) => {
  await relay.unpair(owner, id);
  return noContent(userCorsHeaders(request));
});

/** OPTIONS on any user-side route. */
export async function preflight(request: Request): Promise<NextResponse> {
  return noContent(userCorsHeaders(request));
}
