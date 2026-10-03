"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * The browser half of the one anonymous token scheme: a per-browser device/app ID.
 * It is the publisher-owner credential and the install ID. Stored in localStorage, so it is
 * vulnerable to XSS by nature; the site keeps scripts minimal and never renders capsule text
 * as HTML. Users are told to keep a copy: losing it means losing self-service delete.
 */

const TOKEN_KEY = 'harmoniser.deviceToken';
const TOKEN_EVENT = 'harmoniser-token-change';

function notify(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TOKEN_EVENT));
  }
}

export function createToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = window.localStorage.getItem(TOKEN_KEY);
    return value !== null && value.length >= 32 ? value : null;
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage disabled (private mode): the token still works for this page session.
  }
  notify();
}

/** Returns the existing browser token, creating and storing one on first use. */
export function ensureToken(): string {
  const existing = getStoredToken();
  if (existing !== null) {
    return existing;
  }
  const token = createToken();
  storeToken(token);
  return token;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(TOKEN_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(TOKEN_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function snapshot(): string {
  return getStoredToken() ?? '';
}

function serverSnapshot(): string {
  return '';
}

/**
 * Reads the browser token as external state. The first client render matches the server (''), then
 * the effect creates and stores a token if none exists and notifies subscribers.
 */
export function useDeviceToken(): string {
  const token = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    if (getStoredToken() === null) {
      ensureToken();
    }
  }, []);
  return token;
}
