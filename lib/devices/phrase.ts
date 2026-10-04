// Pairing codes: three lower-case words joined by hyphens ("brave-otter-lamp").
import { randomInt } from "node:crypto";

import { ERR_BAD_CODE, RelayError } from "./errors";
import { EFF_SHORT_WORDLIST } from "./wordlist";

const WORD_PATTERN = /^[a-z]{3,5}$/;
export const CODE_PATTERN = /^[a-z]{3,5}(-[a-z]{3,5}){2}$/;
export const MAX_TYPED_CODE_LENGTH = 64;

/*
 * The EFF list is built for pronounceability, not for safety in every combination. Three random
 * words can land on a phrase that reads as a slur, a religion or a threat (a live example was
 * "islam-goofy-evil"), which is not something a person should see on their own screen. Words
 * covering belief and identity, violence, drugs, sex and illness are removed from the draw
 * instead of being retried after the fact, so those phrases cannot come up at all.
 *
 * Checked by tests/devices/phrase-tokens.test.ts, including that every entry here is a real word
 * from the EFF list and that no generated code contains one.
 */
export const BLOCKED_WORDS: readonly string[] = [
  // belief, identity and political names
  "angel", "cult", "ebony", "guru", "islam", "pagan", "roman", "saint", "santa", "sect", "trump",
  // violence, threats and death
  "agony", "armed", "armor", "army", "arson", "ashes", "ashen", "blade", "blast", "blaze", "curse",
  "drown", "evil", "fang", "filth", "foe", "gore", "grave", "grief", "harm", "hate", "hurt", "lash",
  "punch", "rabid", "rage", "raid", "rebel", "riot", "ruin", "scare", "scary", "slain", "slash",
  "smash", "sting", "stole", "theft", "thorn", "throb", "trash", "trap", "virus", "widow", "wound",
  "wrath", "wreck",
  // drugs
  "coke", "junky",
  // sex and the body
  "boned", "breed", "bust", "gag", "groom", "grope", "hump", "panty", "prude", "shaft", "thigh",
  "thong", "vixen", "womb",
  // illness and disability
  "coma", "deaf", "polio",
];

// The EFF list holds one entry that is not a plain word ("yo-yo"). Its hyphen would make a
// code read as four words, so it is left out. After both filters: 1,218 words, about 31 bits
// for three.
export const CODE_WORDS: readonly string[] = EFF_SHORT_WORDLIST.filter(
  (word) => WORD_PATTERN.test(word) && !BLOCKED_WORDS.includes(word),
);

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
