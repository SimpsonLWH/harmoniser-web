"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { failureText, publishCapsule } from "@/lib/client/api";
import { useOwnerToken } from "@/lib/client/token";
import { validateCapsuleObject } from "@/lib/validator";
import type { Capsule } from "@/lib/validator";

const EXAMPLE = JSON.stringify(
  {
    schemaVersion: 0,
    id: "pasta",
    name: "Pasta night",
    permissions: ["reminders"],
    ui: [
      { type: "text", text: "Dinner" },
      { type: "timer", id: "pasta", label: "Pasta", minutes: 9 },
      { type: "button", label: "Start all", action: "startAllTimers" },
    ],
  },
  null,
  2,
);

export default function PublishPage() {
  const [raw, setRaw] = useState("");
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const token = useOwnerToken();
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => (capsule === null ? "" : JSON.stringify(capsule, null, 2)), [capsule]);

  function validate() {
    setFailure("");
    setPublishedId(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      setCapsule(null);
      setErrors(["That is not valid JSON. Paste the whole capsule file."]);
      return;
    }
    const result = validateCapsuleObject(parsed);
    if (!result.ok || result.capsule === undefined) {
      setCapsule(null);
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setCapsule(result.capsule);
  }

  async function publish() {
    if (capsule === null) {
      return;
    }
    setBusy(true);
    setFailure("");
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
    const result = await publishCapsule(token, {
      capsule,
      name: capsule.name,
      description,
      tags: tagList,
    });
    setBusy(false);
    if (result.ok) {
      setPublishedId(result.data.id);
    } else {
      setFailure(failureText(result.failure));
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Publish a capsule</h1>
      <p className="mt-3 text-[15px] leading-7 text-text-2">
        Paste or drop a capsule JSON file. It is validated against the same schema the app uses
        before anything is published, and you choose exactly what becomes public.
      </p>

      <section className="mt-7 rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold">1. Capsule JSON</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRaw(EXAMPLE);
                setErrors([]);
                setCapsule(null);
              }}
              className="min-h-9 rounded-full bg-surface-2 px-4 text-[13px] font-medium"
            >
              Load an example
            </button>
            <label className="min-h-9 cursor-pointer rounded-full bg-surface-2 px-4 text-[13px] font-medium leading-9">
              Choose a file
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file === undefined) {
                    return;
                  }
                  void file.text().then((text) => {
                    setRaw(text);
                    setErrors([]);
                    setCapsule(null);
                  });
                }}
              />
            </label>
          </div>
        </div>
        <label className="sr-only" htmlFor="capsule-json">
          Capsule JSON
        </label>
        <textarea
          id="capsule-json"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={12}
          spellCheck={false}
          placeholder='{ "schemaVersion": 0, "id": "tea", "name": "Tea timer", ... }'
          className="mt-3 w-full rounded-2xl border border-line bg-bg p-4 font-mono text-[12px] leading-5"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={validate}
            className="min-h-11 rounded-full bg-brand px-5 text-[14px] font-medium text-white"
          >
            Validate
          </button>
          {capsule !== null ? (
            <span className="text-[13px] text-brand">Valid: {capsule.name}</span>
          ) : null}
        </div>
        {errors.length > 0 ? (
          <ul className="mt-4 max-h-56 space-y-1 overflow-auto rounded-2xl bg-danger-soft p-4 text-[13px] leading-5">
            {errors.map((error) => (
              <li key={error} className="font-mono">
                {error}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {capsule !== null ? (
        <>
          <section className="mt-4 rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
            <h2 className="text-[16px] font-semibold">2. What becomes public</h2>
            <p className="mt-2 text-[13px] leading-6 text-text-2">
              This is exactly what anyone can see. Capsule contents are public data: publish only
              deliberate templates, never private notes, health details or secrets.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[13px] font-medium" htmlFor="publish-name">
                  Name
                </label>
                <input
                  id="publish-name"
                  value={capsule.name}
                  readOnly
                  className="mt-1 min-h-11 w-full rounded-input border border-line bg-surface-2 px-4 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium" htmlFor="publish-description">
                  Description ({description.length}/500)
                </label>
                <textarea
                  id="publish-description"
                  value={description}
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-line bg-bg p-4 text-[14px]"
                  placeholder="What does it do, and what should people know before installing?"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium" htmlFor="publish-tags">
                  Tags (comma separated, up to 8)
                </label>
                <input
                  id="publish-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-input border border-line bg-bg px-4 text-[14px]"
                  placeholder="cooking, timer"
                />
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-[14px] font-medium">Public capsule JSON</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-5">
                {preview}
              </pre>
            </details>
          </section>

          <section className="mt-4 rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
            <h2 className="text-[16px] font-semibold">3. Publish with your owner token</h2>
            <p className="mt-2 text-[13px] leading-6 text-text-2">
              Publishing is anonymous. Your owner token is the only delete credential, so keep a
              copy, or you will not be able to delete the capsule later. (Installs and reports use
              a separate anonymous install ID that never owns anything.)
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="max-w-full truncate rounded-full bg-surface-2 px-4 py-2 font-mono text-[12px]">
                {token.length > 0 ? `${token.slice(0, 10)}…${token.slice(-4)}` : "…"}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(token);
                }}
                className="min-h-9 rounded-full bg-surface-2 px-4 text-[13px] font-medium"
              >
                Copy token
              </button>
            </div>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={busy}
              className="mt-4 min-h-11 rounded-full bg-brand px-6 text-[14px] font-medium text-white disabled:opacity-60"
            >
              {busy ? "Publishing…" : "Publish capsule"}
            </button>
            {failure.length > 0 ? (
              <p className="mt-3 rounded-card bg-danger-soft p-4 text-[14px]">{failure}</p>
            ) : null}
            {publishedId !== null ? (
              <div className="mt-4 rounded-card bg-brand-soft p-4 text-[14px]">
                <p className="font-medium">Published.</p>
                <p className="mt-1">
                  It is live at{" "}
                  <Link href={`/capsules/${publishedId}`} className="text-brand underline">
                    /capsules/{publishedId}
                  </Link>
                  . Keep your token: it is the only way to delete it.
                </p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
