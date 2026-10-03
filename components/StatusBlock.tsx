import type { ReactNode } from "react";

/**
 * Layout for the existing empty, error and not-found states: centred icon in a tint circle,
 * a short title, a caption and the state's existing action. Presentational only.
 */
export function StatusBlock({
  icon,
  title,
  titleAs: Title = "p",
  caption,
  children,
}: {
  icon: ReactNode;
  title: ReactNode;
  titleAs?: "h1" | "h2" | "p";
  caption?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="status-icon">{icon}</span>
      <Title className="mt-4 text-body font-bold text-text">{title}</Title>
      {caption !== undefined ? (
        <p className="mt-1.5 max-w-[48ch] text-caption leading-5 text-text-2">{caption}</p>
      ) : null}
      {children !== undefined ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
