import Link from "next/link";

import { CapsuleIcon } from "@/components/Icons";
import { formatInstalls } from "@/lib/format";
import type { CapsuleSummaryDto } from "@/lib/types";

export function CapsuleCard({ capsule }: { capsule: CapsuleSummaryDto }) {
  return (
    <Link
      href={`/capsules/${capsule.id}`}
      className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line-2 bg-surface p-4 transition-colors hover:border-line hover:bg-card"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="icon-tile">
          <CapsuleIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-body font-bold leading-6 text-text">{capsule.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={capsule.widget ? "chip" : "chip chip-plain"}>
              {capsule.widget ? "Widget-ready" : "In the app"}
            </span>
            <span className="chip chip-plain">v{capsule.schemaVersion}</span>
          </div>
        </div>
      </div>
      {capsule.description.length > 0 ? (
        <p className="line-clamp-2 text-label leading-[22px] text-text-2">{capsule.description}</p>
      ) : (
        <p className="text-label leading-[22px] text-text-2">No description yet.</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {capsule.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
        <span className="ml-auto text-caption text-text-2 tabular-nums">{formatInstalls(capsule.installs)}</span>
      </div>
    </Link>
  );
}
