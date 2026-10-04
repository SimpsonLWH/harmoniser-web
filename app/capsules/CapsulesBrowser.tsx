"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CapsuleCard } from "@/components/CapsuleCard";
import { fetchCapsules } from "@/lib/client/api";
import type { CapsuleSummaryDto } from "@/lib/types";

const TAG_CHIPS = ["timer", "counter", "checklist", "cooking", "fitness", "health", "study", "home"];

export function CapsulesBrowser({
  initialItems,
  initialNextCursor,
}: {
  initialItems: CapsuleSummaryDto[];
  initialNextCursor: string | null;
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [items, setItems] = useState<CapsuleSummaryDto[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialItems.length > 0 ? "ready" : "loading",
  );
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  /* The server already rendered the first page; do not fetch it again on mount. */
  const skipFirstLoad = useRef(initialItems.length > 0);

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
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void load({ q: query, tag, cursor: null, append: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tag, load]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Capsule marketplace</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-text-2">
        Community capsules, published anonymously. Every download is plain JSON: the app validates
        it and asks for permissions before anything runs. Nothing here installs itself.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <label className="sr-only" htmlFor="capsule-search">
          Search capsules
        </label>
        <input
          id="capsule-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or description"
          className="min-h-12 w-full rounded-input border border-line bg-surface px-5 text-[15px] text-text placeholder:text-text-3"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(null)}
            aria-pressed={tag === null}
            className={`min-h-9 rounded-full px-4 text-[13px] font-medium transition-colors ${
              tag === null ? "bg-brand text-white" : "bg-surface text-text-2 hover:bg-surface-2"
            }`}
          >
            All
          </button>
          {TAG_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setTag(tag === chip ? null : chip)}
              aria-pressed={tag === chip}
              className={`min-h-9 rounded-full px-4 text-[13px] font-medium transition-colors ${
                tag === chip ? "bg-brand text-white" : "bg-surface text-text-2 hover:bg-surface-2"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {status === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-[168px] animate-pulse rounded-card bg-surface-2" />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-card bg-danger-soft p-5 text-[14px] text-text">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load({ q: query, tag, cursor: null, append: false })}
              className="mt-3 min-h-10 rounded-full bg-danger px-5 text-[14px] font-medium text-white"
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === "ready" && items.length === 0 ? (
          <div className="rounded-card bg-surface p-8 text-center">
            <p className="text-[15px] font-medium">No capsules match that yet.</p>
            <p className="mt-2 text-[14px] text-text-2">
              Try a different search, or publish the first one.
            </p>
          </div>
        ) : null}

        {items.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((capsule) => (
                <CapsuleCard key={capsule.id} capsule={capsule} />
              ))}
            </div>
            {nextCursor !== null ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void load({ q: query, tag, cursor: nextCursor, append: true })}
                  className="min-h-11 rounded-full bg-surface px-6 text-[14px] font-medium text-text shadow-[var(--h-shadow)] disabled:opacity-60"
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
