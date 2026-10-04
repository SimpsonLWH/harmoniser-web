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

export function PhoneIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="6.5" y="2.8" width="11" height="18.4" rx="3" />
      <path d="M10.5 17.6h3" />
    </Glyph>
  );
}

/* Glyphs copied from the harmoniser-canvas boards. */
export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  );
}

export function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M12 4v11M8 8l4-4 4 4" />
      <path d="M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" />
    </Glyph>
  );
}

export function AddHomeIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <path d="M16.5 13.5v6M13.5 16.5h6" />
    </Glyph>
  );
}

export function PencilIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19z" />
      <path d="M13.5 7.5l3 3" />
    </Glyph>
  );
}

export function CloudIcon({ size = 13 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z" />
    </Glyph>
  );
}

export function PeopleIcon({ size = 13 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.2a5.5 5.5 0 0 1 3 4.8" />
    </Glyph>
  );
}

export function ChecklistIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 7l1.8 1.8L9 5.5M4 15l1.8 1.8L9 13.5M12.5 7.5H20M12.5 15.5H20" />
    </Glyph>
  );
}

export function TimerIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.2 2M9.5 3h5" />
    </Glyph>
  );
}

export function ReceiptIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2.5" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </Glyph>
  );
}

export function SuitcaseIcon({ size }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="4" y="7" width="16" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12.5h16" />
    </Glyph>
  );
}

export function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M9 6l6 6-6 6" />
    </Glyph>
  );
}

export function ChevronUpIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M6 15l6-6 6 6" />
    </Glyph>
  );
}

export function ScanIcon({ size = 22 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M7.5 12h9" />
    </Glyph>
  );
}

export function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
}

export function CupIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2.5M12 3.5v2.5" />
    </Glyph>
  );
}

export function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

export function MinusIcon({ size = 18 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M5 12h14" />
    </Glyph>
  );
}
