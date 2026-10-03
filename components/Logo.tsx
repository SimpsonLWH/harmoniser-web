/** The Harmoniser mark, as in the HarmonyOS app. Decorative: the wordmark next to it carries the name. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <path
        d="M8 3h16a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H13l-6 5v-5.3A6 6 0 0 1 2 19V9a6 6 0 0 1 6-6z"
        fill="var(--blue)"
      />
      <rect x="7" y="8.5" width="8" height="8" rx="2.2" fill="var(--on-blue)" />
      <rect x="17.5" y="8.5" width="7.5" height="3.2" rx="1.6" fill="var(--on-blue)" />
      <rect x="17.5" y="13.3" width="4.6" height="3.2" rx="1.6" fill="var(--orange)" />
    </svg>
  );
}
