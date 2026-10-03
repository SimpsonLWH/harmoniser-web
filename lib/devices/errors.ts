/**
 * The one error type the relay core throws. `lib/devices/http.ts` turns it into the site's
 * error envelope: {"error":{"code","message"}}.
 */

export interface Refusal {
  readonly status: number;
  readonly code: string;
  readonly message: string;
}

export class RelayError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | undefined;

  constructor(refusal: Refusal, retryAfterSeconds?: number) {
    super(refusal.message);
    this.name = 'RelayError';
    this.status = refusal.status;
    this.code = refusal.code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const refusal = (status: number, code: string, message: string): Refusal => ({ status, code, message });

// Request bodies. The messages are the firmware's (main/capsule_json.h).
export const ERR_BAD_JSON = refusal(400, 'invalid_json', 'The body must be a JSON object.');
export const ERR_TOO_DEEP = refusal(400, 'invalid_json', 'The JSON is nested too deeply (8 levels at most).');
export const ERR_HAS_NUL = refusal(400, 'invalid_json', 'The body must not contain a NUL character.');
export const ERR_TOO_LARGE = refusal(413, 'payload_too_large', 'The request body is larger than 1024 bytes.');

// Capsules and actions: the rules of the board's own POST /capsule and POST /action.
export const ERR_BAD_TYPE = refusal(400, 'invalid_capsule', 'type must be "timer" or "counter".');
export const ERR_BAD_LABEL = refusal(400, 'invalid_capsule', 'label must be a UTF-8 string.');
export const ERR_BAD_SECONDS = refusal(400, 'invalid_capsule', 'seconds must be a number from 1 to 359999.');
export const ERR_BAD_COUNT = refusal(400, 'invalid_capsule', 'count must be a number from 0 to 999999.');
export const ERR_BAD_RUNNING = refusal(400, 'invalid_capsule', 'running must be true or false.');
export const ERR_BAD_MOTION = refusal(400, 'invalid_capsule', 'motion must be true or false.');
export const ERR_BAD_ACTION = refusal(
  400,
  'invalid_action',
  'action must be one of start, pause, toggle, reset, increment, motion_on, motion_off.',
);

// Registration, pairing and state.
export const ERR_BAD_HW = refusal(400, 'invalid_registration', 'hw must be 1 to 64 letters, digits, _ or -.');
export const ERR_BAD_KIND = refusal(400, 'invalid_registration', 'kind must be a string of 1 to 32 characters.');
export const ERR_BAD_FW = refusal(400, 'invalid_registration', 'fw must be a string of 1 to 64 characters.');
export const ERR_BAD_CODE = refusal(400, 'invalid_code', 'The pairing code must be three words.');
export const ERR_BAD_STATE = refusal(
  400,
  'invalid_state',
  'A state report needs a type and a numeric version, and fields of the right kind.',
);
export const ERR_UNKNOWN_CODE = refusal(
  404,
  'code_not_found',
  'No unpaired device has this code. A code works once, for 10 minutes.',
);
export const ERR_TOO_MANY_DEVICES = refusal(
  409,
  'too_many_devices',
  'This token already has 20 paired devices. Unpair one first.',
);
export const ERR_UNKNOWN_DEVICE = refusal(404, 'not_found', 'No such device.');
export const ERR_UNAUTHORIZED = refusal(401, 'unauthorized', 'Unknown device or device token.');
export const ERR_RATE_LIMITED = refusal(429, 'rate_limited', 'Too many attempts. Try again later.');
export const ERR_BUSY = refusal(503, 'unavailable', 'Could not issue a pairing code. Try again.');
