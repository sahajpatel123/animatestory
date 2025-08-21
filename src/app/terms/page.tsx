export default function TermsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-5xl font-semibold tracking-[0.5px]">Terms of Service</h1>
        <p className="text-black/70 mt-2">Last updated: {new Date().getFullYear()}</p>
      </div>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">1. Acceptance</h2>
        <p>By accessing or using AnimateStory (the “Service”), you agree to these Terms of Service and our Privacy Policy. If you use the Service on behalf of an organization, you represent that you have authority to bind that organization.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">2. Accounts and Access</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must maintain accurate account information and secure your credentials.</li>
          <li>You are responsible for activity under your account.</li>
          <li>We may suspend or terminate access for violations, abuse, or security concerns.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">3. Acceptable Use</h2>
        <p>Do not use the Service to create or distribute content that is unlawful, harmful, hateful, sexually explicit, infringes intellectual property, or violates privacy. We may apply safety filters and moderation at our discretion.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>No attempts to bypass rate limits, quotas, or security controls.</li>
          <li>No reverse engineering or scraping of proprietary models or assets.</li>
          <li>No uploading of malicious code or interference with the Service.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">4. Content and IP</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><span className="text-black">Your Content.</span> You retain rights to prompts and uploads you submit (“User Content”). You grant us a worldwide, non‑exclusive license to process User Content to provide the Service.</li>
          <li><span className="text-black">Generated Output.</span> Subject to your compliance with these Terms and your plan, you may use generated outputs. Draft renders may be watermarked and restricted from commercial use.</li>
          <li><span className="text-black">Service IP.</span> We retain all rights to the Service, software, models, templates, and style packs.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">5. Plans, Billing, and Refunds</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Paid plans are billed monthly or annually. Fees are non‑refundable except where required by law.</li>
          <li>We may change pricing or features with prior notice. Continued use after changes constitutes acceptance.</li>
          <li>Cancelling stops future charges; access continues until the end of the current period.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">6. DMCA and IP Complaints</h2>
        <p>If you believe content infringes your IP, contact us with sufficient detail to locate and assess the material. We may remove content and terminate repeat infringers.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">7. Disclaimers</h2>
        <p>The Service is provided “as is” without warranties of any kind. We do not guarantee uninterrupted or error‑free operation or that outputs will meet your requirements.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">8. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages. Our aggregate liability will not exceed the amounts paid by you in the 3 months preceding the claim.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">9. Termination</h2>
        <p>We may suspend or terminate access immediately for violations or risks to the Service. Upon termination, your right to use the Service ceases; some sections survive termination (e.g., ownership, disclaimers, liability limits).</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-4 text-black/80">
        <h2 className="text-2xl text-black">10. Changes</h2>
        <p>We may update these Terms. Material changes will be notified via the Service or email. Continued use after changes constitutes acceptance.</p>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6 space-y-2 text-black/80">
        <h2 className="text-2xl text-black">11. Contact</h2>
        <p>Questions about these Terms? Contact us via the About page.</p>
      </section>
    </div>
  )
}


