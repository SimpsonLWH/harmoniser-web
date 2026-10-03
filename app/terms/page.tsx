import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms for using the Harmoniser capsule marketplace: anonymous publishing, capsule ownership, acceptable use, moderation and liability.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of service</h1>
      <p className="mt-3 text-[13px] text-text-3">Last updated: 3 October 2026</p>

      <div className="mt-8 space-y-8 text-[15px] leading-7 text-text-2">
        <section>
          <h2 className="text-[18px] font-semibold text-text">1. These terms</h2>
          <p className="mt-2">
            These terms govern your use of the Harmoniser website and capsule marketplace
            (together, &ldquo;the service&rdquo;). By browsing, publishing, installing or reporting a
            capsule you agree to them. If you do not agree, do not use the service. The service is a
            HackYeah 2026 prototype and is provided for demonstration and evaluation.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">2. What the service is</h2>
          <p className="mt-2">
            The service lets people publish and install <em>capsules</em>: small JSON descriptions
            of single-purpose apps. Capsules are data, not code. The Harmoniser app on your device
            validates every capsule against its own schema and asks you to allow or deny each
            permission before anything runs. We never execute a capsule on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">3. Publishing and anonymity</h2>
          <p className="mt-2">
            Publishing is anonymous. When you publish, your browser creates a random owner token
            and we store only a keyed hash of it. That token is the only way to delete the capsule
            later: keep a copy. If you lose it, we cannot prove the capsule is yours, and it may
            stay online until we remove it. Installs, reports and device pairing use a separate
            anonymous install ID, which never owns a capsule. The seeded template capsules are
            permanent built-ins and have no owner token. Do not publish anything you do not have
            the right to share, and do not include personal data about anyone, secrets, or content
            that is unlawful, harmful or misleading.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">4. Installing</h2>
          <p className="mt-2">
            Installing downloads the capsule JSON to your device; the app then validates it and
            shows its permission sheet. Install counts shown on the site are best-effort counters,
            not proof that a capsule ran anywhere. Capsules are untrusted input: do not change your
            device settings to bypass the app&apos;s permission checks.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">5. Moderation</h2>
          <p className="mt-2">
            Every capsule has a report action with fixed reasons. When enough distinct reports are
            accepted, the capsule is hidden from the marketplace automatically while we review it.
            We may also remove or hide any capsule, or restrict publishing, at any time — for
            example to comply with the law, protect people, or keep the service working.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">6. Your content</h2>
          <p className="mt-2">
            You keep ownership of the capsule text you publish. By publishing you grant us a
            non-exclusive licence to store, display and distribute that text through the service,
            including to people who install it. You confirm you have the rights needed to give that
            licence.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">7. No warranty</h2>
          <p className="mt-2">
            The service is an experimental prototype provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;, without warranties of any kind, express or implied, including
            fitness for a particular purpose and uninterrupted availability. Capsules are
            community content: they may be wrong, incomplete or unsuitable for your device.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">8. Limitation of liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, we are not liable for indirect or consequential
            losses, loss of data, or damage arising from capsules published by others or from your
            use of the service. Nothing in these terms limits liability that cannot be limited by
            law.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">9. Changes</h2>
          <p className="mt-2">
            We may change the service and these terms. The date at the top will change when we do,
            and continued use after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">10. Governing law</h2>
          <p className="mt-2">
            These terms are governed by the law of Poland. The courts of Poland have jurisdiction
            over any dispute, without affecting any consumer rights you have where you live. A
            contact channel will be published before any commercial release; this is a HackYeah
            2026 prototype. Do not send personal data through public channels.
            {/* TODO(Lewis): add the operator identity and a contact channel before any commercial release. */}
          </p>
        </section>
      </div>
    </article>
  );
}
