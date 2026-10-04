/*
 * Judges asked what is real and what is faked, so this section says it plainly.
 * Every line mirrors the app README's "What's real and what is simulated" table.
 */

const REAL = [
  "Rules, templates, the on-device model, the permission gatekeeper and its log.",
  "Timer, counter, checklist, number, text and button capsules, plus schema v1 scores and live results.",
  "2x2 and 2x4 home-screen widgets, calendar events, and battery and weather readings.",
  "Marketplace browse and install against the live API.",
];

const SIMULATED = [
  "The wrist prototype is an ESP32 stand-in. It does not run HarmonyOS.",
  "A browser tab can act as a second device through the relay, for testing.",
];

const NOT_YET = [
  "TV and watch capsules.",
  "Capsule-triggered vibration, and notifications that fire after the app closes.",
  "Voice input, and languages other than English.",
];

export function Status() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="rounded-card bg-surface p-6 shadow-frame sm:p-8">
        <h3 className="text-[22px] font-bold tracking-tight">Real today</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {REAL.map((item) => (
            <li key={item} className="flex gap-3 text-[15px] leading-7 text-text-2">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-5">
        <div className="rounded-card bg-surface-2 p-6 sm:p-7">
          <h3 className="text-[18px] font-bold tracking-tight">Simulated, and labelled</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {SIMULATED.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-7 text-text-2">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card bg-surface p-6 shadow-frame sm:p-7">
          <h3 className="text-[18px] font-bold tracking-tight">Not built yet</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {NOT_YET.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-7 text-text-2">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-text-2/40" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
