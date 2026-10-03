"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AlertIcon, CapsuleIcon, CompassIcon, ShieldIcon } from "@/components/Icons";
import { StatusBlock } from "@/components/StatusBlock";
import { countInstall, deleteCapsule, failureText, fetchCapsule, reportCapsule } from "@/lib/client/api";
import { getOwnerToken, storeOwnerToken, useInstallId, useOwnerToken } from "@/lib/client/token";
import { formatDate, formatInstalls, permissionLabel } from "@/lib/format";
import type { CapsuleDetailDto } from "@/lib/types";
import type { Capsule } from "@/lib/validator";

type Status = "loading" | "ready" | "missing" | "error";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "unsafe", label: "Unsafe or misleading" },
  { value: "broken", label: "Does not work" },
  { value: "other", label: "Something else" },
];

export default function CapsuleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<CapsuleDetailDto | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const ownerToken = useOwnerToken();
  const installId = useInstallId();
  const [tokenInput, setTokenInput] = useState("");
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (typeof id !== "string") {
      return;
    }
    let cancelled = false;
    void fetchCapsule(id).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setDetail(result.data);
        setStatus("ready");
      } else if (result.failure.code === "not_found") {
        setStatus("missing");
      } else {
        setStatus("error");
        setError(result.failure.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const capsule = detail?.capsule as Capsule | undefined;
  const permissions = Array.isArray(capsule?.permissions) ? capsule.permissions : [];

  async function download() {
    if (detail === null || typeof id !== "string") {
      return;
    }
    setBusy(true);
    setNotice("");
    const counted = await countInstall(id, installId);
    const json = JSON.stringify(detail.capsule, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `capsule-${detail.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "harmoniser"}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBusy(false);
    setNotice(
      counted.ok
        ? "Downloaded. Open Harmoniser, choose Import, and pick the file: the app validates it and asks for permissions before it runs."
        : `Downloaded, but the install count could not be updated (${counted.failure.message}).`,
    );
  }

  async function copyJson() {
    if (detail === null) {
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify(detail.capsule, null, 2));
    setNotice("Capsule JSON copied.");
  }

  async function submitReport() {
    if (detail === null || typeof id !== "string") {
      return;
    }
    setBusy(true);
    const result = await reportCapsule(id, installId, reason);
    setBusy(false);
    if (result.ok) {
      setNotice(
        result.data.hidden
          ? "Thanks — that report took the capsule out of the marketplace for review."
          : "Thanks, your report was recorded.",
      );
    } else {
      setNotice(failureText(result.failure));
    }
  }

  async function remove() {
    if (detail === null || typeof id !== "string") {
      return;
    }
    setBusy(true);
    const result = await deleteCapsule(id, ownerToken);
    setBusy(false);
    if (result.ok) {
      setNotice("Deleted. The public payload is gone.");
      setStatus("missing");
    } else {
      setNotice(failureText(result.failure));
    }
  }

  if (status === "loading") {
    return (
      <div className="page py-8 sm:py-12" aria-busy="true">
        <div className="h-11 w-36 animate-pulse rounded-btn bg-card" />
        <div className="mt-4 h-[420px] w-full max-w-[420px] animate-pulse rounded-frame bg-card" />
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="page py-10 sm:py-16">
        <StatusBlock
          icon={<CompassIcon size={26} />}
          titleAs="h1"
          title="This capsule is not available"
          caption="It may have been deleted by its publisher, hidden after reports, or the link is wrong."
        >
          <Link href="/capsules" className="btn btn-primary">
            Back to the marketplace
          </Link>
        </StatusBlock>
      </div>
    );
  }

  if (status === "error" || detail === null) {
    return (
      <div className="page py-10 sm:py-16">
        <StatusBlock icon={<AlertIcon size={26} />} titleAs="h1" title="The marketplace is unavailable" caption={error}>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setReloadKey((key) => key + 1);
            }}
            className="btn btn-primary"
          >
            Try again
          </button>
        </StatusBlock>
      </div>
    );
  }

  return (
    <div className="page py-6 sm:py-10">
      <Link href="/capsules" className="btn btn-ghost -ml-3 px-3 text-label">
        ← Marketplace
      </Link>

      <div className="mt-3 grid items-start gap-6 md:grid-cols-[420px_minmax(0,1fr)] md:gap-8">
        {/* The capsule frame: the capsule as the app shows it. */}
        <article className="mx-auto w-full max-w-[420px] overflow-hidden rounded-frame border border-[var(--frame-border)] bg-surface shadow-[var(--shadow-frame)] md:sticky md:top-24">
          <header className="flex items-center gap-3 border-b border-line-2 py-3 pl-3.5 pr-2.5">
            <span className="icon-tile">
              <CapsuleIcon />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-body font-bold leading-6">{detail.name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className={detail.widget ? "chip" : "chip chip-orange"}>
                  {detail.widget ? "Widget-ready" : "In the app"}
                </span>
                <span className="chip chip-plain">schema v{detail.schemaVersion}</span>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-3.5 p-4">
            {detail.description.length > 0 ? (
              <p className="text-label leading-6 text-text-2">{detail.description}</p>
            ) : null}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-2">
              <span className="tabular-nums">{formatInstalls(detail.installs)}</span>
              <span aria-hidden="true">·</span>
              <span>Published {formatDate(detail.createdAt)}</span>
              {detail.tags.length > 0 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{detail.tags.join(", ")}</span>
                </>
              ) : null}
            </p>

            <div className="rounded-card bg-card p-4">
              <h2 className="text-label font-bold">Install on your phone</h2>
              <p className="mt-1.5 text-caption leading-5 text-text-2">
                Download the JSON, then open Harmoniser and choose Import. The app validates the
                capsule, assigns it a fresh local id, asks for permissions, and only saves it when you
                run it.
              </p>
            </div>

            <div className="rounded-card bg-card p-4">
              <h2 className="text-label font-bold">Permissions it asks for</h2>
              {permissions.length > 0 ? (
                <ul className="mt-2.5 flex flex-col gap-2">
                  {permissions.map((permission) => (
                    <li
                      key={permission}
                      className="flex min-h-tap items-center gap-2.5 rounded-[14px] bg-surface px-3 text-label"
                    >
                      <span className="text-blue">
                        <ShieldIcon size={20} />
                      </span>
                      {permissionLabel(permission)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-caption leading-5 text-text-2">
                  No device permissions. It runs entirely in the app.
                </p>
              )}
              <p className="mt-2.5 text-caption leading-5 text-text-2">{detail.widgetReason}</p>
            </div>
          </div>

          <footer className="flex flex-wrap gap-2 border-t border-line-2 px-3 pb-3 pt-2.5">
            <button
              type="button"
              onClick={() => void download()}
              disabled={busy}
              className="btn btn-primary flex-1"
            >
              Download capsule
            </button>
            <button type="button" onClick={() => void copyJson()} className="btn btn-secondary flex-1">
              Copy JSON
            </button>
          </footer>
        </article>

        <div className="flex min-w-0 flex-col gap-3.5">
          <details className="card group">
            <summary className="flex min-h-tap cursor-pointer items-center text-label font-bold">
              View the capsule JSON ({detail.schemaVersion === 1 ? "schema v1" : "schema v0"})
            </summary>
            <pre className="code-block mt-3 max-h-96">{JSON.stringify(detail.capsule, null, 2)}</pre>
          </details>

          <section className="card">
            <h2 className="text-body font-bold">Your owner token</h2>
            <p className="mt-2 max-w-[65ch] text-caption leading-5 text-text-2">
              This anonymous token is the publishing and delete credential. Keep a copy: without it, a
              capsule you published cannot be deleted from this browser. It is sent to the API over
              HTTPS, and the server stores only a keyed hash of it.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <code className="flex min-h-tap max-w-full items-center truncate rounded-[14px] bg-card px-4 font-mono text-[12px]">
                {ownerToken.length > 0 ? `${ownerToken.slice(0, 10)}…${ownerToken.slice(-4)}` : "…"}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(ownerToken);
                  setNotice("Owner token copied. Store it somewhere safe.");
                }}
                className="btn btn-secondary"
              >
                Copy
              </button>
            </div>
            <p className="mt-3 max-w-[65ch] text-caption leading-5 text-text-2">
              Installs and reports use a separate anonymous install ID (
              <span className="font-mono">
                {installId.length > 0 ? `${installId.slice(0, 10)}…${installId.slice(-4)}` : "…"}
              </span>
              ), which never owns a capsule. Cleared site data resets both.
            </p>
            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
              <input
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Paste another owner token to manage its capsules"
                className="field font-mono text-[13px]"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = tokenInput.trim();
                  if (trimmed.length >= 32) {
                    storeOwnerToken(trimmed);
                    setNotice("Using the pasted owner token for this browser.");
                  } else {
                    setNotice("That does not look like an owner token.");
                  }
                }}
                className="btn btn-secondary"
              >
                Use token
              </button>
            </div>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy || getOwnerToken() === null}
              className="btn btn-warn mt-3.5"
            >
              Delete this capsule
            </button>
          </section>

          <section className="card">
            <h2 className="text-body font-bold">Report this capsule</h2>
            <p className="mt-2 max-w-[65ch] text-caption leading-5 text-text-2">
              Reports are anonymous and use fixed reasons — no free text. Three accepted reports hide a
              capsule while it is reviewed.
            </p>
            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="report-reason">
                Report reason
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="field text-label"
              >
                {REPORT_REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void submitReport()}
                disabled={busy}
                className="btn btn-secondary"
              >
                Send report
              </button>
            </div>
          </section>

          <section className="rounded-card bg-card p-4 text-caption leading-5 text-text-2 sm:p-5">
            <h2 className="text-body font-bold text-text">Other devices</h2>
            <p className="mt-2 max-w-[65ch]">
              Phone and home-screen widgets are supported today. TV, watch and the ESP32 wrist
              prototype are coming next —{" "}
              <Link href="/device" className="link">
                see the pairing preview
              </Link>
              . This site never promises a remote install it cannot confirm.
            </p>
          </section>

          {notice.length > 0 ? (
            <p role="status" className="notice">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
