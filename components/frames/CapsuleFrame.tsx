import type { CSSProperties, ReactNode } from "react";

import {
  AddHomeIcon,
  BrandIcon,
  CheckIcon,
  CloseIcon,
  CloudIcon,
  PencilIcon,
  PeopleIcon,
  PhoneIcon,
  QrIcon,
  ShareIcon,
} from "./icons";

/*
 * The frame shell is the app's capsule page: gradient wash, brand row, one
 * floating card with the capsule header and body, then the action bar. Every
 * measurement comes from the canvas files so the web frames and the app match.
 */

export type FrameSize = "phone" | "fold";
export type FrameOrigin = "phone" | "marketplace" | "cloud" | "none";

const SIZES: Record<FrameSize, { w: number; h: number }> = {
  phone: { w: 390, h: 844 },
  fold: { w: 820, h: 740 },
};

type Palette = {
  text: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  tileBg: string;
  tileInk: string;
  chipBg: string;
  chipInk: string;
  buttonBg: string;
  buttonInk: string;
  outlineBg: string;
  outlineBorder: string;
  outlineInk: string;
  qrBg: string;
};

export function framePalette(dark: boolean): Palette {
  return dark
    ? {
        text: "#EEF1F8",
        cardBg: "#161D2F",
        cardBorder: "rgba(255,255,255,0.08)",
        cardShadow: "0 18px 40px rgba(0,0,0,0.35)",
        tileBg: "rgba(110,140,255,0.16)",
        tileInk: "#8FA6FF",
        chipBg: "rgba(110,140,255,0.16)",
        chipInk: "#B9C7FF",
        buttonBg: "rgba(255,255,255,0.08)",
        buttonInk: "#EEF1F8",
        outlineBg: "rgba(255,255,255,0.05)",
        outlineBorder: "rgba(255,255,255,0.10)",
        outlineInk: "#A3ACC0",
        qrBg: "rgba(255,255,255,0.08)",
      }
    : {
        text: "#1B2236",
        cardBg: "rgba(255,255,255,0.94)",
        cardBorder: "rgba(47,91,255,0.12)",
        cardShadow: "0 18px 40px rgba(27,34,54,0.10), 0 1px 2px rgba(27,34,54,0.05)",
        tileBg: "#EAF0FF",
        tileInk: "#2F5BFF",
        chipBg: "#EEF2FF",
        chipInk: "#2A47C7",
        buttonBg: "#2F5BFF",
        buttonInk: "#FFFFFF",
        outlineBg: "#FFFFFF",
        outlineBorder: "#DCE2EE",
        outlineInk: "#1B2236",
        qrBg: "rgba(255,255,255,0.72)",
      };
}

const ORIGIN: Record<Exclude<FrameOrigin, "none">, { label: string; icon: (p: { size: number; stroke: string }) => ReactNode }> = {
  phone: {
    label: "Made on your phone \u00b7 no internet",
    icon: ({ size, stroke }) => <PhoneIcon size={size} stroke={stroke} />,
  },
  marketplace: {
    label: "From the marketplace",
    icon: ({ size, stroke }) => <PeopleIcon size={size} stroke={stroke} />,
  },
  cloud: {
    label: "Made with cloud AI",
    icon: ({ size, stroke }) => <CloudIcon size={size} stroke={stroke} />,
  },
};

export function OriginChip({
  kind,
  dark = false,
  scale = 1,
}: {
  kind: Exclude<FrameOrigin, "none">;
  dark?: boolean;
  scale?: number;
}) {
  const p = framePalette(dark);
  const origin = ORIGIN[kind];
  const chip: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5 * scale,
    padding: `${2 * scale}px ${8 * scale}px ${2 * scale}px ${6 * scale}px`,
    borderRadius: 10 * scale,
    background: p.chipBg,
    color: p.chipInk,
    fontSize: 12 * scale,
    fontWeight: 600,
    lineHeight: `${16 * scale}px`,
  };
  return (
    <span style={chip}>
      {origin.icon({ size: 13 * scale, stroke: p.chipInk })}
      <span>{origin.label}</span>
    </span>
  );
}

export function CapsuleFrame({
  size = "phone",
  dark = false,
  title,
  origin,
  icon,
  children,
  ariaLabel,
  decorative = false,
  className,
  style,
}: {
  size?: FrameSize;
  dark?: boolean;
  title: string;
  origin: FrameOrigin;
  icon: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { w, h } = SIZES[size];
  const p = framePalette(dark);
  const fold = size === "fold";

  return (
    <div
      className={`frame-wrap ${className ?? ""}`}
      style={{ ...style, "--frame-w": w, "--frame-h": h } as CSSProperties}
      role={decorative ? "img" : undefined}
      aria-label={decorative ? ariaLabel : undefined}
    >
      <div className="frame-stage" data-size={size}>
        <div
          className="frame-shot flex flex-col overflow-hidden"
          style={{
            color: p.text,
            /*
             * A frame is a picture of the app, so its gradient is fixed: the app's
             * light theme stays light even when the website is in dark mode.
             */
            backgroundImage: dark
              ? "linear-gradient(180deg, #17234D 0px, #0F1528 220px, #0C111D 380px)"
              : "linear-gradient(180deg, #DCE5FF 0px, #EEF2FB 200px, #F2F4F9 360px)",
          }}
          aria-hidden={decorative ? true : undefined}
        >
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: fold ? "18px 20px 10px 24px" : "18px 16px 10px 20px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BrandIcon size={30} />
              <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.2px" }}>Harmoniser</span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                border: 0,
                background: p.qrBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "default",
              }}
            >
              <QrIcon size={22} stroke={p.text} />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              margin: fold ? "4px 16px 16px" : "4px 12px 16px",
              borderRadius: 28,
              background: p.cardBg,
              border: `1px solid ${p.cardBorder}`,
              boxShadow: p.cardShadow,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: fold ? "12px 12px 12px 16px" : "12px 10px 12px 14px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: p.tileBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                <div
                  style={{
                    maxWidth: "100%",
                    fontSize: 17,
                    fontWeight: 700,
                    lineHeight: "22px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </div>
                {origin === "none" ? null : <OriginChip kind={origin} dark={dark} />}
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  border: 0,
                  background: dark ? "rgba(255,255,255,0.08)" : "#F1F3F8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  flexShrink: 0,
                  cursor: "default",
                }}
              >
                <CloseIcon size={18} stroke={p.text} />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: fold ? 0 : 16,
                display: "flex",
                flexDirection: "column",
                gap: fold ? 0 : 14,
              }}
            >
              {children}
            </div>
          </div>

          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: fold ? "10px 14px 12px" : "10px 12px 12px",
              borderTop: fold ? "1px solid #E8ECF4" : undefined,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                borderRadius: 22,
                border: `1px solid ${p.outlineBorder}`,
                background: dark ? "rgba(255,255,255,0.05)" : "#F5F7FB",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 16px",
                color: p.outlineInk,
                fontSize: 15,
                fontWeight: 500,
                cursor: "default",
              }}
            >
              <PencilIcon size={18} stroke={dark ? "#8FA6FF" : "#2F5BFF"} />
              <span>{"Change it\u2026"}</span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                border: `1px solid ${p.outlineBorder}`,
                background: dark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0,
                cursor: "default",
              }}
            >
              <ShareIcon size={20} stroke={p.text} />
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                border: `1px solid ${p.outlineBorder}`,
                background: dark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0,
                cursor: "default",
              }}
            >
              <AddHomeIcon size={20} stroke={p.text} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small shared pieces used inside capsule bodies. */

export function FramePrimaryButton({
  label,
  icon,
  tone = "brand",
  dark = false,
  height = 54,
  radius = 18,
}: {
  label: string;
  icon?: ReactNode;
  tone?: "brand" | "accent" | "plain";
  dark?: boolean;
  height?: number;
  radius?: number;
}) {
  const p = framePalette(dark);
  const style: CSSProperties =
    tone === "brand"
      ? { background: "#2F5BFF", color: "#FFFFFF" }
      : tone === "accent"
        ? { background: dark ? "#3A2418" : "#FFEDE4", color: dark ? "#FFB08C" : "#A8411A" }
        : { background: p.outlineBg, color: p.text, border: `1px solid ${p.outlineBorder}` };
  return (
    <div
      style={{
        height,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 17,
        fontWeight: 700,
        ...style,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

export function FrameProgress({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5B6478" }}>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#E4E9F3", overflow: "hidden" }}>
        <div style={{ height: 8, width: `${value}%`, borderRadius: 4, background: "#2F5BFF" }} />
      </div>
    </div>
  );
}

export function FrameCheck({ done, tone = "brand" }: { done: boolean; tone?: "brand" | "plain" }) {
  if (!done) {
    return (
      <span
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          boxSizing: "border-box",
          borderRadius: 7,
          border: "2px solid #8E99B2",
          background: "#FFFFFF",
          display: "inline-block",
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: 24,
        height: 24,
        flexShrink: 0,
        borderRadius: 7,
        background: tone === "brand" ? "#2F5BFF" : "#2F5BFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CheckIcon size={15} stroke="#FFFFFF" />
    </span>
  );
}
