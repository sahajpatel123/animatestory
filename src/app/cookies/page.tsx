export default function CookiesPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-5xl font-semibold tracking-[0.5px]">Cookies Policy</h1>
        <p className="text-black/70 mt-2">Last updated: {new Date().getFullYear()}</p>
      </div>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">1. What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device to help websites function and collect information about usage.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">2. Types of Cookies We Use</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Essential: authentication, session, and security.</li>
          <li>Preferences: saves UI and editor settings.</li>
          <li>Analytics: aggregate usage metrics to improve features.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">3. Managing Cookies</h2>
        <p>You can control cookies via your browser settings. Disabling essential cookies may limit functionality.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-3 text-black/80">
        <h2 className="text-2xl text-black">4. Changes</h2>
        <p>We may update this policy to reflect changes in technology or regulation. Updates will be posted here.</p>
      </section>
    </div>
  )
}


