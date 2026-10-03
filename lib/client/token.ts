'use client';

/**
 * The browser's two anonymous identities. Both travel in the same wire header
 * (X-Harmoniser-Token); they are different values with different jobs:
 *
 * - ownerToken: the publishing and deletion credential of POST /api/capsules and
 *   DELETE /api/capsules/{id}. The server stores only hashToken(ownerToken).
 * - installId: the persistent anonymous client id for install/report deduplication and for the
 *   relay's user side (/pair, "send to another device"). The server stores only
 *   hashPrincipal(installId). It never owns a capsule.
 *
 * A third credential — the relay's device bearer token — is issued by the server to a device
 * and is not kept here at all; see docs/device-relay.md.
 *
 * Both are random 32-byte values in localStorage, so they are XSS-exposed by nature; the site
 * keeps scripts minimal and never renders capsule text as HTML. Losing the ownerToken means
 * losing self-service delete; losing the installId only resets deduplication and unpairs the
 * browser's relay devices (the app's copy of a capsule is unaffected).
 *
 * Migration from the one-token era: an existing `harmoniser.deviceToken` is copied into BOTH
 * identities, so previously published capsules stay deletable and previously paired relay
 * devices stay paired. The legacy key is left in place for one release so a rollback keeps
 * working; new browsers get two independent values.
 */

import { useEffect, useSyncExternalStore } from "react";

const OWNER_KEY = "harmoniser.ownerToken";
const INSTALL_KEY = "harmoniser.installId";
const LEGACY_KEY = "harmoniser.deviceToken";
const TOKEN_EVENT = "harmoniser-token-change";

export type TokenKind = "owner" | "install";

/** 32 random bytes, base64url, with a small readable prefix. */
export function createToken(kind: TokenKind): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  const value = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${kind === "owner" ? "own" : "ins"}_${value}`;
}

export interface StoredTokens {
  ownerToken: string | null;
  installId: string | null;
  legacy: string | null;
}

export interface ResolvedTokens {
  ownerToken: string;
  installId: string;
  persist: { ownerToken?: string; installId?: string };
}

/**
 * The pure decision: what the two identities should be, and which of them need writing.
 * A legacy single token becomes both, which is what keeps existing ownership and pairings.
 */
export function resolveTokenState(
  stored: StoredTokens,
  generate: (kind: TokenKind) => string,
): ResolvedTokens {
  const ownerToken = stored.ownerToken ?? stored.legacy ?? generate("owner");
  const installId = stored.installId ?? stored.legacy ?? generate("install");
  return {
    ownerToken,
    installId,
    persist: {
      ...(stored.ownerToken === null ? { ownerToken } : {}),
      ...(stored.installId === null ? { installId } : {}),
    },
  };
}

function notify(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TOKEN_EVENT));
  }
}

function readStored(): StoredTokens {
  if (typeof window === "undefined") {
    return { ownerToken: null, installId: null, legacy: null };
  }
  try {
    const get = (key: string): string | null => {
      const value = window.localStorage.getItem(key);
      return value !== null && value.length >= 32 ? value : null;
    };
    return {
      ownerToken: get(OWNER_KEY),
      installId: get(INSTALL_KEY),
      legacy: get(LEGACY_KEY),
    };
  } catch {
    return { ownerToken: null, installId: null, legacy: null };
  }
}

/** Reads both identities, creating and storing what is missing (including the migration). */
export function ensureTokens(): { ownerToken: string; installId: string } {
  const stored = readStored();
  const resolved = resolveTokenState(stored, createToken);
  if (resolved.persist.ownerToken !== undefined || resolved.persist.installId !== undefined) {
    try {
      if (resolved.persist.ownerToken !== undefined) {
        window.localStorage.setItem(OWNER_KEY, resolved.persist.ownerToken);
      }
      if (resolved.persist.installId !== undefined) {
        window.localStorage.setItem(INSTALL_KEY, resolved.persist.installId);
      }
    } catch {
      // Storage disabled (private mode): the values still work for this page session.
    }
    notify();
  }
  return { ownerToken: resolved.ownerToken, installId: resolved.installId };
}

export function getOwnerToken(): string | null {
  return typeof window === "undefined" ? null : ensureTokens().ownerToken;
}

export function getInstallId(): string | null {
  return typeof window === "undefined" ? null : ensureTokens().installId;
}

/** Replaces the owner credential (the capsule page's "use another token"). */
export function storeOwnerToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(OWNER_KEY, token);
  } catch {
    // Storage disabled: the token still works for this page session.
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(TOKEN_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(TOKEN_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function ownerSnapshot(): string {
  return ensureTokens().ownerToken;
}

function installSnapshot(): string {
  return ensureTokens().installId;
}

function serverSnapshot(): string {
  return "";
}

function useIdentity(snapshot: () => string): string {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    ensureTokens();
  }, []);
  return value;
}

/** The publishing/deletion credential (POST /api/capsules, DELETE /api/capsules/{id}). */
export function useOwnerToken(): string {
  return useIdentity(ownerSnapshot);
}

/** The install/report/relay identity (installs, reports, /pair, send-to-device). */
export function useInstallId(): string {
  return useIdentity(installSnapshot);
}
