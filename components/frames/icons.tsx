import type { SVGProps } from "react";

/*
 * Icons are the exact paths drawn in the capsule-frame canvas and the app's own
 * logo.svg. They are design assets from the app, kept verbatim so the web frames
 * and the app screens stay the same drawing.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/*
 * The mark is the app's own icon, layered from AppScope background.png and
 * foreground.png. It is a raster asset, so it is served as an image rather than
 * redrawn as paths.
 */
export function BrandIcon({ size = 30, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand-icon.png"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ display: "block", borderRadius: Math.round(size * 0.22), flexShrink: 0 }}
    />
  );
}

export function QrIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.8} {...props}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
      <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
      <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
      <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7.5 12h9" />
    </Icon>
  );
}

export function CloseIcon({ size = 18, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function CheckIcon({ size = 16, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={3} {...props}>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </Icon>
  );
}

export function PencilIcon({ size = 18, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19z" />
      <path d="M13.5 7.5l3 3" />
    </Icon>
  );
}

export function ShareIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <path d="M12 4v11" />
      <path d="M8 8l4-4 4 4" />
      <path d="M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" />
    </Icon>
  );
}

export function AddHomeIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <path d="M16.5 13.5v6M13.5 16.5h6" />
    </Icon>
  );
}

export function PlusIcon({ size = 18, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.4} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function MinusIcon({ size = 18, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.2} {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function InfoIcon({ size = 15, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5h.01" />
    </Icon>
  );
}

export function SunIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </Icon>
  );
}

export function CloudIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z" />
    </Icon>
  );
}

export function RainIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15z" />
      <path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" />
    </Icon>
  );
}

export function SnowIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 6.5 4.25 4.25 0 0 0 7 15z" />
      <path d="M9 19h.01M13 19h.01M17 19h.01M11 21.5h.01M15 21.5h.01" strokeWidth={2.6} />
    </Icon>
  );
}

export function PartlyIcon({ size = 20, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.9} {...props}>
      <path d="M9 3v1.2M3 9h1.2M4.8 4.8l.9.9M13.2 4.8l-.9.9" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 .4-6.98A4.8 4.8 0 0 0 9 11.8 3.6 3.6 0 0 0 9 19z" />
    </Icon>
  );
}

export function PeopleIcon({ size = 13, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.2} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.2a5.5 5.5 0 0 1 3 4.8" />
    </Icon>
  );
}

export function PhoneIcon({ size = 13, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.2} {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 17.5h2" />
    </Icon>
  );
}

export function ChecklistIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M4 7l1.8 1.8L9 5.5" />
      <path d="M4 15l1.8 1.8L9 13.5" />
      <path d="M12.5 7.5H20M12.5 15.5H20" />
    </Icon>
  );
}

export function TimerIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9.5V13l2.5 2M10 3h4" />
    </Icon>
  );
}

export function DropIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M12 3.5c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.1 2.5-6.3 6-10.5z" />
    </Icon>
  );
}

export function QuestionIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="8.5" />
    </Icon>
  );
}

export function SuitcaseIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <rect x="3.5" y="7" width="17" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12.5h16" />
    </Icon>
  );
}

export function HabitIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <rect x="4" y="5.5" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </Icon>
  );
}

export function ReceiptIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </Icon>
  );
}

export function SwapIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M7 4v16M4 7l3-3 3 3" />
      <path d="M17 20V4M14 17l3 3 3-3" />
    </Icon>
  );
}

export function TennisIcon({ size = 22, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M5.2 6.8c3.2 2.6 3.2 7.8 0 10.4M18.8 6.8c-3.2 2.6-3.2 7.8 0 10.4" />
    </Icon>
  );
}

export function TennisBallIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#FF7A45" />
      <path
        d="M5.5 6.5c3 2.5 3 8.5 0 11M18.5 6.5c-3 2.5-3 8.5 0 11"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
      />
    </svg>
  );
}

export function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" fill="#FFFFFF" />
    </svg>
  );
}

export function PauseIcon({ size = 18, fill = "#FFFFFF" }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1.3" fill={fill} />
      <rect x="13.5" y="5" width="4" height="14" rx="1.3" fill={fill} />
    </svg>
  );
}

export function CoffeeIcon({ size = 18, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
      <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M9 3.5v2.5M12.5 3.5v2.5" />
    </Icon>
  );
}

export function ChevronDownIcon({ size = 16, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowLeftIcon({ size = 18, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} {...props}>
      <path d="M9 6L4 11l5 5" />
      <path d="M4 11h10a5 5 0 0 1 0 10h-3" />
    </Icon>
  );
}
