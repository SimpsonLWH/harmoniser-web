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
    <div className="page max-w-[760px] py-10 sm:py-14">
      <h1 className="page-title">Publish a capsule</h1>
      <p className="lede mt-3">
        Paste or drop a capsule JSON file. It is validated against the same schema the app uses
        before anything is published, and you choose exactly what becomes public.
      </p>

      <section className="card mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-body font-bold">1. Capsule JSON</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRaw(EXAMPLE);
                setErrors([]);
                setCapsule(null);
              }}
              className="btn btn-secondary"
            >
              Load an example
            </button>
            <label className="btn btn-secondary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue">
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
          className="field mt-3.5 p-4 font-mono text-caption font-normal leading-5"
        />
        <div className="mt-3.5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={validate}
            className="btn btn-primary"
          >
            Validate
          </button>
          {capsule !== null ? (
            <span className="chip">Valid — {capsule.name}</span>
          ) : null}
        </div>
        {errors.length > 0 ? (
          <ul className="mt-3.5 max-h-56 space-y-1 overflow-auto rounded-[14px] bg-orange-tint p-4 text-caption leading-5 text-orange-text">
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
          <section className="card mt-3.5">
            <h2 className="text-body font-bold">2. What becomes public</h2>
            <p className="mt-2 text-caption leading-5 text-text-2">
              This is exactly what anyone can see. Capsule contents are public data: publish only
              deliberate templates, never private notes, health details or secrets.
            </p>
            <div className="mt-3.5 space-y-3.5">
              <div>
                <label className="text-caption font-semibold text-text-2" htmlFor="publish-name">
                  Name
                </label>
                <input
                  id="publish-name"
                  value={capsule.name}
                  readOnly
                  className="field mt-1.5 bg-card text-label"
                />
              </div>
              <div>
                <label className="text-caption font-semibold text-text-2" htmlFor="publish-description">
                  Description ({description.length}/500)
                </label>
                <textarea
                  id="publish-description"
                  value={description}
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="field mt-1.5 text-label"
                  placeholder="What does it do, and what should people know before installing?"
                />
              </div>
              <div>
                <label className="text-caption font-semibold text-text-2" htmlFor="publish-tags">
                  Tags (comma separated, up to 8)
                </label>
                <input
                  id="publish-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="field mt-1.5 text-label"
                  placeholder="cooking, timer"
                />
              </div>
            </div>
            <details className="mt-3.5">
              <summary className="flex min-h-tap cursor-pointer items-center text-label font-bold">Public capsule JSON</summary>
              <pre className="code-block mt-2 max-h-64">
                {preview}
              </pre>
            </details>
          </section>

          <section className="card mt-3.5">
            <h2 className="text-body font-bold">3. Publish with your owner token</h2>
            <p className="mt-2 text-caption leading-5 text-text-2">
              Publishing is anonymous. Your owner token is the only delete credential — keep a
              copy, or you will not be able to delete the capsule later. (Installs and reports use
              a separate anonymous install ID that never owns anything.)
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <code className="flex min-h-tap max-w-full items-center truncate rounded-[14px] bg-card px-4 font-mono text-badge">
                {token.length > 0 ? `${token.slice(0, 10)}…${token.slice(-4)}` : "…"}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(token);
                }}
                className="btn btn-secondary"
              >
                Copy token
              </button>
            </div>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={busy}
              className="btn btn-primary mt-3.5 px-6"
            >
              {busy ? "Publishing…" : "Publish capsule"}
            </button>
            {failure.length > 0 ? (
              <p className="notice notice-warn mt-3.5">{failure}</p>
            ) : null}
            {publishedId !== null ? (
              <div className="notice mt-3.5">
                <p className="font-bold">Published.</p>
                <p className="mt-1">
                  It is live at{" "}
                  <Link href={`/capsules/${publishedId}`} className="link break-all">
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
