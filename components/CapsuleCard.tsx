import Link from "next/link";

import { formatInstalls } from "@/lib/format";
import type { CapsuleSummaryDto } from "@/lib/types";

/*
 * Capsule identity colour, the same idea as the widget's stableColorTag: a
 * capsule keeps one accent for its whole life, derived from its id.
 */
const ACCENTS = ["#0A59F7", "#ED6F21", "#2DA44E", "#8A5CF5", "#E84D6E", "#00A3B4"];

export function accentFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000003;
  }
  return ACCENTS[hash % ACCENTS.length];
}

export function CapsuleCard({ capsule }: { capsule: CapsuleSummaryDto }) {
  const accent = accentFor(capsule.id);
  const initial = capsule.name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <Link
      href={`/capsules/${capsule.id}`}
      className="flex min-h-[176px] flex-col rounded-card bg-surface p-5 shadow-frame transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-[13px] text-[17px] font-extrabold"
          style={{ background: `${accent}1f`, color: accent }}
        >
          {initial}
        </span>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <h3 className="text-[17px] font-bold leading-6 text-text">{capsule.name}</h3>
          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-2">
            v{capsule.schemaVersion}
          </span>
        </div>
      </div>

      {capsule.description.length > 0 ? (
        <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-text-2">{capsule.description}</p>
      ) : (
        <p className="mt-3 text-[14px] leading-6 text-text-2">No description yet.</p>
      )}

      <div className="mt-auto pt-4">
        {capsule.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {capsule.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-text-2">
          <span>{formatInstalls(capsule.installs)}</span>
          <span aria-hidden="true">/</span>
          <span>{capsule.widget ? "Widget-ready" : "In the app"}</span>
        </div>
      </div>
    </Link>
  );
}
