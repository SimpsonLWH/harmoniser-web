"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
          ? "Thanks. That report took the capsule out of the marketplace for review."
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
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6" aria-busy="true">
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-surface-2" />
        <div className="mt-4 h-24 animate-pulse rounded-card bg-surface-2" />
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">This capsule is not available</h1>
        <p className="mt-3 text-[15px] text-text-2">
          It may have been deleted by its publisher, hidden after reports, or the link is wrong.
        </p>
        <Link href="/capsules" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-[15px] font-medium text-white">
          Back to the marketplace
        </Link>
      </div>
    );
  }

  if (status === "error" || detail === null) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">The marketplace is unavailable</h1>
        <p className="mt-3 text-[15px] text-text-2">{error}</p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            setReloadKey((key) => key + 1);
          }}
          className="mt-6 min-h-11 rounded-full bg-brand px-5 text-[15px] font-medium text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/capsules" className="text-[13px] text-text-2 hover:text-text">
        ← Marketplace
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{detail.name}</h1>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-[12px] font-medium text-text-2">
          schema v{detail.schemaVersion}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-medium ${
            detail.widget ? "bg-brand-soft text-brand" : "bg-warning-soft text-warning"
          }`}
        >
          {detail.widget ? "Widget-ready" : "In the app"}
        </span>
      </div>
      {detail.description.length > 0 ? (
        <p className="mt-4 text-[15px] leading-7 text-text-2">{detail.description}</p>
      ) : null}
      <p className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-text-3">
        <span>{formatInstalls(detail.installs)}</span>
        <span aria-hidden="true">·</span>
        <span>Published {formatDate(detail.createdAt)}</span>
        {detail.tags.length > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{detail.tags.join(", ")}</span>
          </>
        ) : null}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
          <h2 className="text-[16px] font-semibold">Install on your phone</h2>
          <p className="mt-2 text-[14px] leading-6 text-text-2">
            Download the JSON, then open Harmoniser and choose Import. The app validates the
            capsule, assigns it a fresh local id, asks for permissions, and only saves it when you
            run it.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void download()}
              disabled={busy}
              className="min-h-11 rounded-full bg-brand px-5 text-[14px] font-medium text-white disabled:opacity-60"
            >
              Download capsule
            </button>
            <button
              type="button"
              onClick={() => void copyJson()}
              className="min-h-11 rounded-full bg-surface-2 px-5 text-[14px] font-medium text-text"
            >
              Copy JSON
            </button>
          </div>
        </div>

        <div className="rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
          <h2 className="text-[16px] font-semibold">Permissions it asks for</h2>
          {permissions.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6 text-text-2">
              {permissions.map((permission) => (
                <li key={permission}>{permissionLabel(permission)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[14px] leading-6 text-text-2">
              No device permissions. It runs entirely in the app.
            </p>
          )}
          <p className="mt-3 text-[13px] leading-6 text-text-3">{detail.widgetReason}</p>
        </div>
      </div>

      <details className="mt-4 rounded-card border border-line p-5">
        <summary className="cursor-pointer text-[15px] font-medium">
          View the capsule JSON ({detail.schemaVersion === 1 ? "schema v1" : "schema v0"})
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-5">
          {JSON.stringify(detail.capsule, null, 2)}
        </pre>
      </details>

      <section className="mt-8 rounded-card bg-surface p-5 shadow-[var(--h-shadow)]">
        <h2 className="text-[16px] font-semibold">Your owner token</h2>
        <p className="mt-2 text-[13px] leading-6 text-text-2">
          This anonymous token is the publishing and delete credential. Keep a copy: without it, a
          capsule you published cannot be deleted from this browser. It is sent to the API over
          HTTPS, and the server stores only a keyed hash of it.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-full bg-surface-2 px-4 py-2 font-mono text-[12px]">
            {ownerToken.length > 0 ? `${ownerToken.slice(0, 10)}…${ownerToken.slice(-4)}` : "…"}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(ownerToken);
              setNotice("Owner token copied. Store it somewhere safe.");
            }}
            className="min-h-9 rounded-full bg-surface-2 px-4 text-[13px] font-medium"
          >
            Copy
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-6 text-text-3">
          Installs and reports use a separate anonymous install ID (
          <span className="font-mono">
            {installId.length > 0 ? `${installId.slice(0, 10)}…${installId.slice(-4)}` : "…"}
          </span>
          ), which never owns a capsule. Cleared site data resets both.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Paste another owner token to manage its capsules"
            className="min-h-11 w-full rounded-input border border-line bg-bg px-4 font-mono text-[12px]"
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
            className="min-h-11 shrink-0 rounded-full bg-surface-2 px-5 text-[13px] font-medium"
          >
            Use token
          </button>
        </div>
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy || getOwnerToken() === null}
          className="mt-4 min-h-11 rounded-full bg-danger-soft px-5 text-[14px] font-medium text-danger disabled:opacity-60"
        >
          Delete this capsule
        </button>
      </section>

      <section className="mt-4 rounded-card border border-line p-5">
        <h2 className="text-[16px] font-semibold">Report this capsule</h2>
        <p className="mt-2 text-[13px] text-text-2">
          Reports are anonymous and use fixed reasons, with no free text. Three accepted reports hide a
          capsule while it is reviewed.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="report-reason">
            Report reason
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-11 w-full rounded-input border border-line bg-bg px-4 text-[14px]"
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
            className="min-h-11 shrink-0 rounded-full bg-surface-2 px-5 text-[14px] font-medium disabled:opacity-60"
          >
            Send report
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-card border border-line p-5 text-[13px] leading-6 text-text-2">
        <h2 className="text-[16px] font-semibold text-text">Other devices</h2>
        <p className="mt-2">
          Phone and home-screen widgets are supported today. TV, watch and the ESP32 wrist
          prototype are coming next.{" "}
          <Link href="/device" className="text-brand hover:underline">
            see the pairing preview
          </Link>
          . This site never promises a remote install it cannot confirm.
        </p>
      </section>

      {notice.length > 0 ? (
        <p role="status" className="mt-4 rounded-card bg-brand-soft p-4 text-[14px] leading-6 text-text">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
