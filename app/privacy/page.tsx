import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How the Harmoniser app and capsule marketplace handle data: on-device by default, cloud AI only when you turn it on, anonymous marketplace tokens and your GDPR rights.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-3 text-[13px] text-text-3">Last updated: 3 October 2026</p>

      <div className="mt-8 space-y-8 text-[15px] leading-7 text-text-2">
        <section>
          <h2 className="text-[18px] font-semibold text-text">Who is responsible</h2>
          <p className="mt-2">
            The Harmoniser project (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs this website and the
            capsule marketplace, and publishes the Harmoniser app for HarmonyOS. For the purposes
            of the EU General Data Protection Regulation (GDPR), we act as the controller for the
            data described below. You can reach us for any privacy request through{" "}
            <a className="text-brand hover:underline" href="https://github.com/SimpsonLWH/harmoniser-web/issues" rel="noreferrer">
              the project issue tracker
            </a>
            . Harmoniser is a HackYeah 2026 prototype; this notice will be reviewed before any
            commercial release.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">What the app does on your device</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Capsules you create, their state (counters, checklists, timers) and your permission
              choices are stored on your device. We never receive them from the app.
            </li>
            <li>
              Rule-based generation and the optional on-device model run locally. The on-device
              engine is built so it makes no network calls.
            </li>
            <li>
              Cloud AI is off by default. If you turn it on and add your own API key, the text you
              type is sent to the provider you chose so it can build the capsule. Your key stays on
              your device and is never packed into the app or sent to us.
            </li>
            <li>
              When a capsule asks for a device feature (reminders, notifications, motion, and so
              on), the app shows a permission sheet first. Denials are final and are logged on the
              device.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">What the marketplace stores</h2>
          <p className="mt-2">
            If you publish a capsule on this site, or install one, we process:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              the capsule JSON you choose to publish, with the name, description and tags you
              enter — this is public by design and shown to anyone who visits the marketplace;
            </li>
            <li>
              a hash of your anonymous device token. The token itself never leaves your browser or
              device in plain text and is never shown in public listings; the hash is what proves
              you can delete a capsule you published;
            </li>
            <li>
              a one-way hash of your IP address, used only to enforce the publish rate limit and to
              de-duplicate install and report actions. The raw IP is not stored;
            </li>
            <li>
              ordinary server logs from our hosting provider, which may include IP addresses and
              request metadata for security and debugging.
            </li>
          </ul>
          <p className="mt-2">
            Browsing the marketplace needs no account. We do not sell data, and we do not run
            advertising or third-party analytics trackers.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">Why we may process it (legal bases)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-text">Performance of a service you asked for</strong>{" "}
              (Art. 6(1)(b) GDPR): publishing, listing, installing and deleting capsules.
            </li>
            <li>
              <strong className="font-medium text-text">Legitimate interests</strong> (Art. 6(1)(f)
              GDPR): keeping the marketplace available and abuse-resistant, rate limiting and
              moderation.
            </li>
            <li>
              <strong className="font-medium text-text">Consent</strong> (Art. 6(1)(a) GDPR): where
              we ask for it before doing anything optional; you can withdraw it at any time.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">How long we keep it</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Published capsules: until the publisher deletes them or we remove them (deletion
              removes the public payload immediately; a minimal audit record may remain).
            </li>
            <li>Install and report receipts: about 24 hours.</li>
            <li>Rate-limit buckets: about 25 hours in total.</li>
            <li>Hosting logs: according to our hosting provider&apos;s short retention.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">Who processes it with us</h2>
          <p className="mt-2">
            The site and its API run on Vercel, and the data is stored in MongoDB Atlas. Both are
            established providers that process data on our behalf, and both may process data
            outside the European Economic Area using standard contractual safeguards. We do not
            share marketplace data with anyone else except where the law requires it.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">Your rights</h2>
          <p className="mt-2">
            Under the GDPR you can ask for access to your data, correction, deletion, restriction,
            portability, and you can object to processing based on legitimate interests. Because
            marketplace publishing is anonymous, we usually cannot identify you from a capsule
            alone; if you hold the device token used to publish it, you can delete it yourself, and
            we can act on a request that identifies the exact capsule. You also have the right to
            complain to a supervisory authority — for example the Polish Data Protection
            Authority (UODO) where this project was built, or the authority in your own country.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">Security and children</h2>
          <p className="mt-2">
            Traffic is encrypted in transit, tokens are stored only as keyed hashes, and the
            database user is least-privilege. The marketplace is not intended for children, and we
            do not knowingly collect data from children.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-text">Changes</h2>
          <p className="mt-2">
            We will update this page when the marketplace changes, and the date at the top will
            change with it. This notice covers the HackYeah 2026 prototype and will be reviewed
            before any commercial release.
          </p>
        </section>
      </div>
    </article>
  );
}
