export default function PrivacyPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-5xl font-semibold tracking-[0.5px]">Privacy Policy</h1>
        <p className="text-black/70 mt-2">Last updated: {new Date().getFullYear()}</p>
      </div>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Account data: name, email, authentication tokens.</li>
          <li>Usage data: prompts, scene structures, render metadata.</li>
          <li>System data: device, browser, IP for security and abuse prevention.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">2. How We Use Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide and improve the Service (queueing, rendering, asset caching).</li>
          <li>Safety and abuse detection (moderation, rate limiting, anomaly detection).</li>
          <li>Communications about updates, security, and support.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">3. Sharing</h2>
        <p>We do not sell your data. We may share limited data with service providers (e.g., hosting, storage, analytics) under contracts that protect your information.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">4. Security</h2>
        <p>We apply industry practices to protect data at rest and in transit. Secrets are stored in environment variables or a secure manager and are never exposed to the client.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">5. Your Choices</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access, export, or delete your projects at any time.</li>
          <li>Control cookies via browser settings (see Cookies Policy).</li>
          <li>Opt out of non‑essential communications.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">6. International</h2>
        <p>Your data may be processed in regions where our providers operate, subject to appropriate safeguards.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">7. Changes</h2>
        <p>We may update this policy. Material changes will be notified via the Service or email.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-2 text-black/80">
        <h2 className="text-2xl text-black">8. Contact</h2>
        <p>Questions about this policy? Contact us via the About page.</p>
      </section>
    </div>
  )
}


