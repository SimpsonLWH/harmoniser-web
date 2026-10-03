import Link from "next/link";

import { formatInstalls } from "@/lib/format";
import type { CapsuleSummaryDto } from "@/lib/types";

export function CapsuleCard({ capsule }: { capsule: CapsuleSummaryDto }) {
  return (
    <Link
      href={`/capsules/${capsule.id}`}
      className="flex min-h-[168px] flex-col rounded-card bg-surface p-5 shadow-[var(--h-shadow)] transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-semibold leading-6 text-text">{capsule.name}</h3>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-text-2">
          v{capsule.schemaVersion}
        </span>
      </div>
      {capsule.description.length > 0 ? (
        <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-text-2">{capsule.description}</p>
      ) : (
        <p className="mt-2 text-[14px] leading-6 text-text-3">No description yet.</p>
      )}
      <div className="mt-auto pt-4">
        {capsule.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {capsule.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-text-3">
          <span>{formatInstalls(capsule.installs)}</span>
          <span aria-hidden="true">·</span>
          <span>{capsule.widget ? "Widget-ready" : "In the app"}</span>
        </div>
      </div>
    </Link>
  );
}
