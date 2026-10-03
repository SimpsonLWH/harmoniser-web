// The relay itself: registration, pairing, capsules, actions and state, against a DeviceStore.
// No HTTP, no database, no framework. Every method throws RelayError for a refused request.
import { cleanAction, cleanCapsule, cleanState, type Action, type Capsule, type DeviceState } from "./capsule";
import {
  ERR_BAD_FW,
  ERR_BAD_HW,
  ERR_BAD_KIND,
  ERR_BUSY,
  ERR_RATE_LIMITED,
  ERR_UNAUTHORIZED,
  ERR_UNKNOWN_CODE,
  ERR_UNKNOWN_DEVICE,
  RelayError,
} from "./errors";
import { field, type JsonObject } from "./json";
import { generateCode, requireCode } from "./phrase";
import { CodeTakenError, type DeviceRecord, type DeviceStore } from "./store";
import { deviceTokenMatches, hashDeviceToken, newDeviceId, newDeviceToken, parseBearer } from "./tokens";

export interface RelayConfig {
  readonly codeTtlMs: number;
  readonly rateWindowMs: number;
  readonly claimsPerOwner: number;
  readonly claimsPerIp: number;
  readonly registrationsPerIp: number;
}

export const DEFAULT_CONFIG: RelayConfig = {
  codeTtlMs: 10 * 60 * 1000,
  rateWindowMs: 5 * 60 * 1000,
  claimsPerOwner: 10,
  claimsPerIp: 60,
  registrationsPerIp: 60,
};

export interface RelayOptions {
  readonly config?: Partial<RelayConfig>;
  readonly now?: () => number;
  readonly newCode?: () => string;
}

export interface RegisterAnswer {
  id: string;
  token: string;
  code: string;
  pair_url: string;
}

export interface PollAnswer {
  claimed: boolean;
  version: number;
  capsule: Capsule | null;
  action_seq: number;
  action: Action | null;
  code: string | null;
  pair_url: string | null;
}

export interface DeviceSummary {
  id: string;
  kind: string;
  fw: string;
  version: number;
  capsule: Capsule | null;
  last_seen_ms_ago: number;
}

export type StateAnswer = Partial<DeviceState> & { last_seen_ms_ago: number };

const HW_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const CODE_ATTEMPTS = 5;

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= maxLength;
}

export function pairUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/pair?code=${code}`;
}

export function createRelay(store: DeviceStore, options: RelayOptions = {}) {
  const config: RelayConfig = { ...DEFAULT_CONFIG, ...options.config };
  const now = options.now ?? Date.now;
  const newCode = options.newCode ?? generateCode;

  // `subject` (an address or an owner hash) is hashed by the store; it is never kept as it is.
  async function limit(route: string, subject: string, max: number): Promise<void> {
    const time = now();
    const count = await store.hit(`${route}|${subject}`, config.rateWindowMs, time);
    if (count > max) {
      const windowEnd = (Math.floor(time / config.rateWindowMs) + 1) * config.rateWindowMs;
      throw new RelayError(ERR_RATE_LIMITED, Math.max(1, Math.ceil((windowEnd - time) / 1000)));
    }
  }

  // Runs `attempt` with fresh codes until one is not taken by another unclaimed device.
  async function withFreshCode<T>(attempt: (code: string, expiresAt: number) => Promise<T>): Promise<T> {
    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      try {
        return await attempt(newCode(), now() + config.codeTtlMs);
      } catch (error) {
        if (!(error instanceof CodeTakenError)) {
          throw error;
        }
      }
    }
    throw new RelayError(ERR_BUSY);
  }

  async function owned(id: string, owner: string): Promise<DeviceRecord> {
    const device = await store.findDevice(id);
    // The same answer for "no such device" and "not yours": ids are not worth confirming.
    if (device === null || device.ownerHash !== owner) {
      throw new RelayError(ERR_UNKNOWN_DEVICE);
    }
    return device;
  }

  return {
    config,

    // ---- device side ----

    async register(body: JsonObject, baseUrl: string, ip: string): Promise<RegisterAnswer> {
      const hw = field(body, "hw");
      const kind = field(body, "kind");
      const fw = field(body, "fw");
      if (typeof hw !== "string" || !HW_PATTERN.test(hw)) {
        throw new RelayError(ERR_BAD_HW);
      }
      if (!isText(kind, 32)) {
        throw new RelayError(ERR_BAD_KIND);
      }
      if (!isText(fw, 64)) {
        throw new RelayError(ERR_BAD_FW);
      }
      await limit("devices-register", ip, config.registrationsPerIp);
      const token = newDeviceToken();
      const device = await withFreshCode((code, codeExpiresAt) =>
        store.registerDevice({
          hw,
          newId: newDeviceId(),
          kind,
          fw,
          tokenHash: hashDeviceToken(token),
          code,
          codeExpiresAt,
          now: now(),
        }),
      );
      const code = device.code ?? "";
      return { id: device.id, token, code, pair_url: pairUrl(baseUrl, code) };
    },

    // The device a board's request is about, or 401. An unknown id is a 401 too.
    async authenticateDevice(id: string, authorization: string | null | undefined): Promise<DeviceRecord> {
      const token = parseBearer(authorization);
      const device = await store.findDevice(id);
      // Hash and compare even when the device is unknown, so both cases take the same time.
      const matches = deviceTokenMatches(token ?? "", device?.tokenHash ?? hashDeviceToken("no such device"));
      if (token === null || device === null || !matches) {
        throw new RelayError(ERR_UNAUTHORIZED);
      }
      return device;
    },

    async poll(device: DeviceRecord, baseUrl: string): Promise<PollAnswer> {
      const time = now();
      await store.touchDevice(device, time);
      let current = device;
      const codeIsDead = device.code === null || device.codeExpiresAt === null || device.codeExpiresAt <= time;
      if (device.ownerHash === null && codeIsDead) {
        // Null: claimed in this very moment. The next poll says so.
        current = (await withFreshCode((code, expiresAt) => store.renewCode(device.id, code, expiresAt))) ?? device;
      }
      const claimed = current.ownerHash !== null;
      const code = claimed ? null : current.code;
      return {
        claimed,
        version: current.version,
        capsule: current.capsule,
        action_seq: current.actionSeq,
        action: current.action,
        code,
        pair_url: code === null ? null : pairUrl(baseUrl, code),
      };
    },

    async report(device: DeviceRecord, body: JsonObject): Promise<void> {
      await store.saveState(device.id, device.tokenHash, cleanState(body), now());
    },

    // ---- user side ----

    async claim(owner: string, ip: string, body: JsonObject): Promise<{ id: string; kind: string }> {
      await limit("devices-claim-owner", owner, config.claimsPerOwner);
      await limit("devices-claim", ip, config.claimsPerIp);
      const code = requireCode(field(body, "code"));
      const device = await store.claimByCode(code, owner, now());
      if (device === null) {
        throw new RelayError(ERR_UNKNOWN_CODE);
      }
      return { id: device.id, kind: device.kind };
    },

    async list(owner: string): Promise<{ devices: DeviceSummary[] }> {
      const time = now();
      const devices = await store.listByOwner(owner);
      return {
        devices: devices.map((device) => ({
          id: device.id,
          kind: device.kind,
          fw: device.fw,
          version: device.version,
          capsule: device.capsule,
          last_seen_ms_ago: Math.max(0, time - device.lastSeenAt),
        })),
      };
    },

    async putCapsule(owner: string, id: string, body: JsonObject): Promise<{ version: number }> {
      const capsule = cleanCapsule(body);
      const version = await store.setCapsule(id, owner, capsule);
      if (version === null) {
        throw new RelayError(ERR_UNKNOWN_DEVICE);
      }
      return { version };
    },

    async postAction(owner: string, id: string, body: JsonObject): Promise<{ action_seq: number }> {
      const action = cleanAction(body);
      const actionSeq = await store.setAction(id, owner, action);
      if (actionSeq === null) {
        throw new RelayError(ERR_UNKNOWN_DEVICE);
      }
      return { action_seq: actionSeq };
    },

    async getState(owner: string, id: string): Promise<StateAnswer> {
      const device = await owned(id, owner);
      return { ...(device.state ?? {}), last_seen_ms_ago: Math.max(0, now() - device.lastSeenAt) };
    },

    async unpair(owner: string, id: string): Promise<void> {
      if (!(await store.releaseDevice(id, owner, now()))) {
        throw new RelayError(ERR_UNKNOWN_DEVICE);
      }
    },
  };
}

export type Relay = ReturnType<typeof createRelay>;
