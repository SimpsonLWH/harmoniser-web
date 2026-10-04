/*
 * What the phone checks before a capsule runs. Every number on this page comes
 * from the app's own evaluation log; nothing here is estimated for the website.
 */

const EXAMPLE = `{
  "schemaVersion": 0,
  "id": "pasta",
  "name": "Pasta night",
  "permissions": ["reminders"],
  "ui": [
    { "type": "timer", "id": "pasta", "minutes": 9 },
    { "type": "button", "action": "startAllTimers" }
  ]
}`;

/* Examples of permission names the schema can declare. */
const PERMISSIONS = ["reminders", "motion", "battery", "weather"];

export function Bento() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-6 rounded-card bg-surface p-6 shadow-frame sm:p-8">
        <div>
          <h3 className="text-[22px] font-bold tracking-tight">A capsule is JSON, not code</h3>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-7 text-text-2">
            Nothing in a capsule executes. The validator rejects unknown fields, wrong types and
            actions a capsule may not take, and the app validates again on every install.
          </p>
        </div>
        <pre className="max-w-full overflow-x-auto rounded-tile bg-surface-2 p-4 font-mono text-[12px] leading-6 text-text-3">
          <code>{EXAMPLE}</code>
        </pre>
      </div>

      <div className="grid min-w-0 gap-5">
        <div className="rounded-card bg-brand-soft p-6 sm:p-7">
          <h3 className="text-[22px] font-bold tracking-tight text-brand-ink">On-device first</h3>
          <p className="mt-2 text-[15px] leading-7 text-text-2">
            The rule parser answers offline. In the team&apos;s emulator evaluation the on-device
            model got 9 of 15 requests on its own, and 11 of 15 once the rules ran first.
          </p>
          <div className="mt-5 flex items-end gap-6">
            <span className="flex flex-col">
              <span className="text-[40px] font-extrabold leading-none tracking-tight text-brand-ink">9/15</span>
              <span className="mt-1 text-[13px] font-semibold text-text-2">model alone</span>
            </span>
            <span className="flex flex-col">
              <span className="text-[40px] font-extrabold leading-none tracking-tight text-brand-ink">11/15</span>
              <span className="mt-1 text-[13px] font-semibold text-text-2">with rules first</span>
            </span>
          </div>
        </div>

        <div className="rounded-card bg-surface p-6 shadow-frame sm:p-7">
          <h3 className="text-[22px] font-bold tracking-tight">Permissions are the API</h3>
          <p className="mt-2 text-[15px] leading-7 text-text-2">
            Capsule permissions are checked before a device feature runs. Deny one and that part is
            shown as blocked, refused when tapped, and written to the log.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PERMISSIONS.map((permission) => (
              <span
                key={permission}
                className="rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-semibold text-text"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
