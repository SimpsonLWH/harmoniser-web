"use client";

import { useCallback, useEffect, useState } from "react";

import { CapsuleCard } from "@/components/CapsuleCard";
import { AlertIcon, SearchIcon } from "@/components/Icons";
import { StatusBlock } from "@/components/StatusBlock";
import { fetchCapsules } from "@/lib/client/api";
import type { CapsuleSummaryDto } from "@/lib/types";

const GRID = "grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
const SEGMENT = "min-h-tap shrink-0 rounded-[11px] px-4 text-label font-semibold transition-colors";
const SEGMENT_ON = "bg-surface text-text shadow-[var(--shadow-soft)]";
const SEGMENT_OFF = "text-text-2 hover:text-text";

const TAG_CHIPS = ["timer", "counter", "checklist", "cooking", "fitness", "health", "study", "home"];

export default function CapsulesPage() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [items, setItems] = useState<CapsuleSummaryDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (options: { q: string; tag: string | null; cursor: string | null; append: boolean }) => {
      if (options.append) {
        setLoadingMore(true);
      } else {
        setStatus("loading");
      }
      const result = await fetchCapsules({
        q: options.q,
        tag: options.tag ?? undefined,
        cursor: options.cursor,
      });
      if (result.ok) {
        setItems((previous) => (options.append ? [...previous, ...result.data.capsules] : result.data.capsules));
        setNextCursor(result.data.nextCursor);
        setStatus("ready");
        setError("");
      } else {
        setStatus("error");
        setError(result.failure.message);
      }
      setLoadingMore(false);
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void load({ q: query, tag, cursor: null, append: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tag, load]);

  return (
    <div className="page py-10 sm:py-14">
      <h1 className="page-title">Capsule marketplace</h1>
      <p className="lede mt-3">
        Community capsules, published anonymously. Every download is plain JSON: the app validates
        it and asks for permissions before anything runs. Nothing here installs itself.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <label className="sr-only" htmlFor="capsule-search">
          Search capsules
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-2">
            <SearchIcon size={20} />
          </span>
          <input
            id="capsule-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or description"
            className="field min-h-12 pl-11"
          />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex gap-0.5 rounded-[14px] bg-card p-[3px]">
            <button
              type="button"
              onClick={() => setTag(null)}
              aria-pressed={tag === null}
              className={`${SEGMENT} ${tag === null ? SEGMENT_ON : SEGMENT_OFF}`}
            >
              All
            </button>
            {TAG_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setTag(tag === chip ? null : chip)}
                aria-pressed={tag === chip}
                className={`${SEGMENT} ${tag === chip ? SEGMENT_ON : SEGMENT_OFF}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {status === "loading" ? (
          <div className={GRID} aria-busy="true">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-[168px] animate-pulse rounded-card bg-card" />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <StatusBlock icon={<AlertIcon size={26} />} title={error}>
            <button
              type="button"
              onClick={() => void load({ q: query, tag, cursor: null, append: false })}
              className="btn btn-primary"
            >
              Try again
            </button>
          </StatusBlock>
        ) : null}

        {status === "ready" && items.length === 0 ? (
          <StatusBlock
            icon={<SearchIcon size={26} />}
            title="No capsules match that yet."
            caption="Try a different search, or publish the first one."
          />
        ) : null}

        {items.length > 0 ? (
          <>
            <div className={GRID}>
              {items.map((capsule) => (
                <CapsuleCard key={capsule.id} capsule={capsule} />
              ))}
            </div>
            {nextCursor !== null ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void load({ q: query, tag, cursor: nextCursor, append: true })}
                  className="btn btn-secondary px-6"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
