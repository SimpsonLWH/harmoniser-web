/**
 * A few rounded-stroke glyphs (stroke 1.8, round caps and joins) in the app's icon style.
 * Inline SVG, no icon library. All decorative: aria-hidden, colour from currentColor.
 */
import type { ReactNode } from "react";

function Glyph({ size = 22, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

/** A capsule: a small app window with two blocks. */
export function CapsuleIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="4" />
      <path d="M7.5 9.5h4M7.5 13.5h9" />
    </Glyph>
  );
}

export function SearchIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Glyph>
  );
}

export function AlertIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v4.9M12 16.2h.01" />
    </Glyph>
  );
}

export function CompassIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </Glyph>
  );
}

export function ShieldIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M12 3.5 5 6.2v5.3c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6.2z" />
      <path d="m9.2 12 2 2 3.8-4" />
    </Glyph>
  );
}

export function ChevronLeftIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="m14.5 6-6 6 6 6" />
    </Glyph>
  );
}
