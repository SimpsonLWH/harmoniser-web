import type { ReactNode } from "react";

/**
 * The app's CapsuleFrame (Capsules components/CapsuleFrame.ets): title bar with a 42px icon tile,
 * name and origin chip, then the body, then an optional footer. Presentational only.
 */
export function AppFrame({
  icon,
  name,
  nameAs: Name = "p",
  chips,
  action,
  footer,
  children,
  className = "",
}: {
  icon: ReactNode;
  name: ReactNode;
  nameAs?: "h1" | "h2" | "h3" | "p";
  chips?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`frame flex flex-col ${className}`}>
      <div className="frame-bar">
        <span className="icon-tile">{icon}</span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <Name className="title max-w-full truncate">{name}</Name>
          {chips !== undefined ? <div className="flex flex-wrap items-center gap-1.5">{chips}</div> : null}
        </div>
        {action}
      </div>
      <div className="frame-body flex-1">{children}</div>
      {footer !== undefined ? <div className="frame-foot">{footer}</div> : null}
    </div>
  );
}
