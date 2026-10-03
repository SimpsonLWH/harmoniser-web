// The route files themselves, called the way Next calls them, on the in-memory store.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as deviceRoute from "@/app/api/devices/[id]/route";
import * as actionRoute from "@/app/api/devices/[id]/action/route";
import * as capsuleRoute from "@/app/api/devices/[id]/capsule/route";
import * as stateRoute from "@/app/api/devices/[id]/state/route";
import * as claimRoute from "@/app/api/devices/claim/route";
import * as registerRoute from "@/app/api/devices/register/route";
import * as listRoute from "@/app/api/devices/route";
import { redact } from "@/lib/devices/http";
import { resetMemoryRelay, usesMemoryStore } from "@/lib/devices/runtime";
import { newToken } from "@/lib/ownership";

const ORIGIN = "http://localhost:3000";
const at = (id: string) => ({ params: Promise.resolve({ id }) });

interface Options {
  user?: string; // X-Harmoniser-Token
  device?: string; // Authorization: Bearer
  body?: unknown;
  raw?: BodyInit;
  headers?: Record<string, string>;
  ip?: string | null;
}

function request(method: string, path: string, options: Options = {}): Request {
  const headers = new Headers({ host: "localhost:3000", ...options.headers });
  if (options.ip !== null) {
    headers.set("x-forwarded-for", options.ip ?? "198.51.100.1");
  }
  if (options.user !== undefined) {
    headers.set("X-Harmoniser-Token", options.user);
  }
  if (options.device !== undefined) {
    headers.set("Authorization", `Bearer ${options.device}`);
  }
  const body = options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
  if (body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Request(ORIGIN + path, { method, headers, body });
}

interface Registered {
  id: string;
  token: string;
  code: string;
  pair_url: string;
}

async function registerDevice(hw = "board-1", kind = "wrist", headers?: Record<string, string>): Promise<Registered> {
  const response = await registerRoute.POST(
    request("POST", "/api/devices/register", { body: { hw, kind, fw: "t" }, headers }),
  );
  expect(response.status).toBe(201);
  return (await response.json()) as Registered;
}

const poll = (id: string, device?: string) =>
  capsuleRoute.GET(request("GET", `/api/devices/${id}/capsule`, { device }), at(id));
const claim = (user: string | undefined, code: unknown, options: Options = {}) =>
  claimRoute.POST(request("POST", "/api/devices/claim", { user, body: { code }, ...options }));
const errorCode = async (response: Response) => ((await response.json()) as { error: { code: string } }).error.code;

let logged: string[];

beforeEach(() => {
  vi.stubEnv("DEVICE_RELAY_STORE", "memory");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL", "");
  resetMemoryRelay();
  logged = [];
  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(" "));
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("the whole flow over the route files", () => {
  it("registers, pairs, sends a capsule and an action, reports state, lists and unpairs", async () => {
    const user = newToken();
    const device = await registerDevice();
    expect(device.pair_url).toBe(`${ORIGIN}/pair?code=${device.code}`);

    let response = await poll(device.id, device.token);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      claimed: false,
      version: 0,
      capsule: null,
      action_seq: 0,
      action: null,
      code: device.code,
      pair_url: device.pair_url,
    });

    response = await claim(user, device.code.toUpperCase().replaceAll("-", " "));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: device.id, kind: "wrist" });

    response = await capsuleRoute.PUT(
      request("PUT", `/api/devices/${device.id}/capsule`, { user, body: { type: "counter", label: "Pull-ups", count: 0 } }),
      at(device.id),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 1 });

    response = await actionRoute.POST(
      request("POST", `/api/devices/${device.id}/action`, { user, body: { action: "increment" } }),
      at(device.id),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ action_seq: 1 });

    expect(await (await poll(device.id, device.token)).json()).toEqual({
      claimed: true,
      version: 1,
      capsule: { type: "counter", label: "Pull-ups", count: 0 },
      action_seq: 1,
      action: "increment",
      code: null,
      pair_url: null,
    });

    const state = {
      type: "counter",
      label: "Pull-ups",
      count: 7,
      seconds: 0,
      remaining_seconds: 0,
      running: false,
      done: false,
      motion: false,
      version: 1,
    };
    response = await stateRoute.POST(
      request("POST", `/api/devices/${device.id}/state`, { device: device.token, body: state }),
      at(device.id),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");

    response = await stateRoute.GET(request("GET", `/api/devices/${device.id}/state`, { user }), at(device.id));
    expect(response.status).toBe(200);
    const reported = (await response.json()) as Record<string, unknown>;
    expect(reported).toMatchObject(state);
    expect(reported.last_seen_ms_ago).toBeGreaterThanOrEqual(0);
    expect(reported.last_seen_ms_ago).toBeLessThan(5000);

    response = await listRoute.GET(request("GET", "/api/devices", { user }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ devices: [{ id: device.id, kind: "wrist", version: 1 }] });

    response = await deviceRoute.DELETE(request("DELETE", `/api/devices/${device.id}`, { user }), at(device.id));
    expect(response.status).toBe(204);
    expect(await (await listRoute.GET(request("GET", "/api/devices", { user }))).json()).toEqual({ devices: [] });
    expect(await (await poll(device.id, device.token)).json()).toMatchObject({ claimed: false, capsule: null });
    expect(logged).toEqual([]);
  });

  it("registers a browser tab as kind web", async () => {
    const user = newToken();
    const device = await registerDevice("web-0123456789abcdef", "web");
    expect(await (await claim(user, device.code)).json()).toEqual({ id: device.id, kind: "web" });
  });

  it("takes a body without a Content-Type, as curl -d sends it", async () => {
    const response = await registerRoute.POST(
      request("POST", "/api/devices/register", {
        raw: '{"hw":"b","kind":"wrist","fw":"t"}',
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
    );
    expect(response.status).toBe(201);
  });
});

describe("pair_url", () => {
  it("is built from NEXT_PUBLIC_SITE_URL when that is set, whatever host the request names", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://harmoniser.keanuc.net/");
    const device = await registerDevice();
    expect(device.pair_url).toBe(`https://harmoniser.keanuc.net/pair?code=${device.code}`);
    const polled = (await (await poll(device.id, device.token)).json()) as { pair_url: string };
    expect(polled.pair_url).toBe(device.pair_url);
  });

  it("falls back to the host the request came in on, with https behind a proxy", async () => {
    const device = await registerDevice("b", "wrist", {
      "x-forwarded-host": "harmoniser-web.vercel.app",
      "x-forwarded-proto": "https",
    });
    expect(device.pair_url).toBe(`https://harmoniser-web.vercel.app/pair?code=${device.code}`);
    expect(device.pair_url.length).toBeLessThanOrEqual(62); // a version 4 QR code on the board
  });

  it("does not echo a Host header that is not a plain host", async () => {
    const device = await registerDevice("b", "wrist", { host: "evil.example/x?y=<script>" });
    expect(device.pair_url).toMatch(/^http:\/\/localhost:3000\/pair\?code=/);
  });
});

describe("authentication on the routes", () => {
  it("answers 401 on the device routes for a wrong token, none, and an unknown device", async () => {
    const device = await registerDevice();
    expect((await poll(device.id, "wrong-token")).status).toBe(401);
    expect((await poll(device.id)).status).toBe(401);
    expect((await poll("no-such-device", device.token)).status).toBe(401);
    const response = await stateRoute.POST(
      request("POST", `/api/devices/${device.id}/state`, { device: "wrong-token", body: { type: "idle", version: 0 } }),
      at(device.id),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "unauthorized", message: "Unknown device or device token." },
    });
  });

  it("answers 401 before it looks at the body of a state report", async () => {
    const device = await registerDevice();
    const response = await stateRoute.POST(
      request("POST", `/api/devices/${device.id}/state`, { device: "wrong-token", raw: "x".repeat(5000) }),
      at(device.id),
    );
    expect(response.status).toBe(401);
  });

  it("does not take the user token in place of the device token, or the other way round", async () => {
    const user = newToken();
    const device = await registerDevice();
    await claim(user, device.code);
    expect((await poll(device.id, user)).status).toBe(401);
    const asUser = await capsuleRoute.GET(
      request("GET", `/api/devices/${device.id}/capsule`, { user: device.token }),
      at(device.id),
    );
    expect(asUser.status).toBe(401);
    // The device token has the shape of a user token, but it owns nothing.
    const response = await stateRoute.GET(
      request("GET", `/api/devices/${device.id}/state`, { user: device.token }),
      at(device.id),
    );
    expect(response.status).toBe(404);
  });

  it("answers 401 on every user route without X-Harmoniser-Token, or with a malformed one", async () => {
    const device = await registerDevice();
    const id = device.id;
    for (const user of [undefined, "too-short", "bad characters !!".repeat(4)]) {
      const responses = await Promise.all([
        claim(user, device.code),
        listRoute.GET(request("GET", "/api/devices", { user })),
        capsuleRoute.PUT(request("PUT", `/api/devices/${id}/capsule`, { user, body: { type: "counter" } }), at(id)),
        actionRoute.POST(request("POST", `/api/devices/${id}/action`, { user, body: { action: "reset" } }), at(id)),
        stateRoute.GET(request("GET", `/api/devices/${id}/state`, { user }), at(id)),
        deviceRoute.DELETE(request("DELETE", `/api/devices/${id}`, { user }), at(id)),
      ]);
      expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401, 401]);
      expect(await errorCode(responses[0])).toBe("unauthorized");
    }
    expect(await (await poll(id, device.token)).json()).toMatchObject({ claimed: false, version: 0 });
  });

  it("does not take Authorization: Bearer for a user", async () => {
    const user = newToken();
    const response = await listRoute.GET(request("GET", "/api/devices", { device: user }));
    expect(response.status).toBe(401);
  });

  it("answers 404 to another user on every route of a paired device", async () => {
    const owner = newToken();
    const other = newToken();
    const device = await registerDevice();
    await claim(owner, device.code);
    const id = device.id;
    const responses = await Promise.all([
      capsuleRoute.PUT(request("PUT", `/api/devices/${id}/capsule`, { user: other, body: { type: "counter" } }), at(id)),
      actionRoute.POST(request("POST", `/api/devices/${id}/action`, { user: other, body: { action: "reset" } }), at(id)),
      stateRoute.GET(request("GET", `/api/devices/${id}/state`, { user: other }), at(id)),
      deviceRoute.DELETE(request("DELETE", `/api/devices/${id}`, { user: other }), at(id)),
    ]);
    expect(responses.map((response) => response.status)).toEqual([404, 404, 404, 404]);
    expect(await errorCode(responses[0])).toBe("not_found");
    expect(await (await listRoute.GET(request("GET", "/api/devices", { user: other }))).json()).toEqual({ devices: [] });
  });
});

describe("origins", () => {
  it("refuses a user request from a foreign web origin, and lets the site's own origin through", async () => {
    const user = newToken();
    const device = await registerDevice();
    const foreign = await claim(user, device.code, { headers: { origin: "https://evil.example" } });
    expect(foreign.status).toBe(403);
    expect(await errorCode(foreign)).toBe("origin_not_allowed");
    const own = await claim(user, device.code, { headers: { origin: ORIGIN } });
    expect(own.status).toBe(200);
    expect(own.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("answers a preflight for PUT from an allowed origin", async () => {
    const response = await capsuleRoute.OPTIONS(
      request("OPTIONS", "/api/devices/dev_1/capsule", { headers: { origin: ORIGIN } }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toContain("PUT");
    expect(response.headers.get("access-control-allow-headers")).toContain("x-harmoniser-token");
  });
});

describe("bad requests on the routes", () => {
  it("answers 400 in the site's error envelope for a capsule the board would refuse, and changes nothing", async () => {
    const user = newToken();
    const device = await registerDevice();
    await claim(user, device.code);
    const put = (raw: string) =>
      capsuleRoute.PUT(request("PUT", `/api/devices/${device.id}/capsule`, { user, raw }), at(device.id));
    const cases: [string, string][] = [
      ['{"type":"timer","label":"No seconds"}', "invalid_capsule"],
      ['{"type":"counter","count":-1}', "invalid_capsule"],
      ['{"type":"counter","x":[[[[[[[[1]]]]]]]]}', "invalid_json"],
      ['{"type":"counter","label":"a\\u0000"}', "invalid_json"],
      ["not json", "invalid_json"],
    ];
    for (const [raw, code] of cases) {
      const response = await put(raw);
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe(code);
      expect(body.error.message.length).toBeGreaterThan(10);
    }
    expect(await (await poll(device.id, device.token)).json()).toMatchObject({ version: 0, capsule: null });
  });

  it("answers 400 for an action the board does not know", async () => {
    const user = newToken();
    const device = await registerDevice();
    await claim(user, device.code);
    const response = await actionRoute.POST(
      request("POST", `/api/devices/${device.id}/action`, { user, body: { action: "explode" } }),
      at(device.id),
    );
    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("invalid_action");
  });

  it("answers 413 for a body over 1024 bytes, declared or not", async () => {
    const big = JSON.stringify({ hw: "b", kind: "wrist", fw: "t", pad: "x".repeat(1100) });
    const declared = await registerRoute.POST(request("POST", "/api/devices/register", { raw: big }));
    expect(declared.status).toBe(413);
    expect(await errorCode(declared)).toBe("payload_too_large");

    // No Content-Length: a stream that would go on for 4 MB is cut off after the limit.
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 4096) {
          controller.close();
          return;
        }
        controller.enqueue(new Uint8Array(1024).fill(0x20));
      },
    });
    const streamed = await registerRoute.POST(
      new Request(`${ORIGIN}/api/devices/register`, {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.1" },
        body: stream,
        duplex: "half",
      } as RequestInit),
    );
    expect(streamed.status).toBe(413);
    expect(pulled).toBeLessThan(10);
  });

  it("answers 404 and 400 on claim, and 429 with Retry-After after ten attempts by one user", async () => {
    const user = newToken();
    const device = await registerDevice();
    expect((await claim(user, "not-the-code")).status).toBe(404);
    expect((await claim(user, "123456")).status).toBe(400);
    expect((await claim(user, "only-two")).status).toBe(400);
    for (let i = 0; i < 7; i++) {
      expect(await errorCode(await claim(user, "not-the-code"))).toBe("code_not_found");
    }
    const limited = await claim(user, device.code);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(Number(limited.headers.get("retry-after"))).toBeLessThanOrEqual(300);
    expect(await errorCode(limited)).toBe("rate_limited");
    // Another user is not held up by it, and the code is still good.
    expect((await claim(newToken(), device.code)).status).toBe(200);
  });

  it("counts claim attempts per client address across users", async () => {
    const attempt = (ip: string) => claim(newToken(), "not-the-code", { ip: `10.9.9.9, ${ip}` });
    for (let i = 0; i < 300; i++) {
      expect((await attempt("203.0.113.7")).status).toBe(404);
    }
    expect((await attempt("203.0.113.7")).status).toBe(429);
    expect((await attempt("203.0.113.8")).status).toBe(404);
  });

  it("fails closed with 503 when the platform gives no client address", async () => {
    const user = newToken();
    const registered = await registerRoute.POST(
      request("POST", "/api/devices/register", { body: { hw: "b", kind: "wrist", fw: "t" }, ip: null }),
    );
    expect(registered.status).toBe(503);
    expect(await errorCode(registered)).toBe("rate_limit_unavailable");
    expect((await claim(user, "not-the-code", { ip: null })).status).toBe(503);
  });
});

describe("configuration and failures", () => {
  it("does not use the in-memory store on Vercel, whatever the variable says", () => {
    expect(usesMemoryStore()).toBe(true);
    vi.stubEnv("VERCEL", "1");
    expect(usesMemoryStore()).toBe(false);
  });

  it("answers 503 without details and logs no secret when the database is not configured", async () => {
    vi.stubEnv("DEVICE_RELAY_STORE", "");
    vi.stubEnv("MONGODB_URI", "");
    const response = await registerRoute.POST(
      request("POST", "/api/devices/register", { body: { hw: "b", kind: "wrist", fw: "t" } }),
    );
    expect(response.status).toBe(503);
    expect(await errorCode(response)).toBe("unavailable");
    expect(logged).toEqual([
      "device relay: register failed: MissingEnvError: Missing required environment variable MONGODB_URI",
    ]);
  });

  it("takes pairing codes and tokens out of what it logs", () => {
    const text = 'E11000 duplicate key { code: "brave-otter-lamp" } Bearer Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4Zm9v';
    expect(redact(text)).toBe('E11000 duplicate key { code: "<code>" } Bearer <redacted>');
  });
});
