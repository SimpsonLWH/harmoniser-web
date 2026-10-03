// Pairing codes: three lower-case words joined by hyphens ("brave-otter-lamp").
import { randomInt } from "node:crypto";

import { ERR_BAD_CODE, RelayError } from "./errors";
import { EFF_SHORT_WORDLIST } from "./wordlist";

const WORD_PATTERN = /^[a-z]{3,5}$/;
export const CODE_PATTERN = /^[a-z]{3,5}(-[a-z]{3,5}){2}$/;
export const MAX_TYPED_CODE_LENGTH = 64;

// The EFF list holds one entry that is not a plain word ("yo-yo"). Its hyphen would make a
// code read as four words, so it is left out: 1,295 words, about 31 bits for three.
export const CODE_WORDS: readonly string[] = EFF_SHORT_WORDLIST.filter((word) => WORD_PATTERN.test(word));

export type RandomIndex = (exclusiveMax: number) => number;

export function generateCode(randomIndex: RandomIndex = randomInt): string {
  return [0, 1, 2].map(() => CODE_WORDS[randomIndex(CODE_WORDS.length)]).join("-");
}

// "  Brave  Otter-Lamp " -> "brave-otter-lamp": what a person types, as the relay stores it.
export function normaliseCode(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((part) => part !== "")
    .join("-");
}

// The normalised code, or null if the text cannot be a pairing code.
export function parseCode(text: unknown): string | null {
  if (typeof text !== "string" || text.length > MAX_TYPED_CODE_LENGTH) {
    return null;
  }
  const code = normaliseCode(text);
  return CODE_PATTERN.test(code) ? code : null;
}

export function requireCode(text: unknown): string {
  const code = parseCode(text);
  if (code === null) {
    throw new RelayError(ERR_BAD_CODE);
  }
  return code;
}
