"use client"
import { useState } from 'react'
import Reveal from '@/components/Reveal'

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free Draft',
      price: 0,
      features: ['720p @ 24fps', 'Watermark', '1 style pack', 'Basic voices'],
      cta: 'Start for free',
    },
    {
      name: 'Creator',
      price: 19,
      features: ['1080p @ 30fps', 'No watermark', 'Premium voices', '3 style packs', 'Priority render'],
      cta: 'Go Creator',
      highlight: true,
    },
    {
      name: 'Studio',
      price: 49,
      features: ['4K ready', 'Team collaboration', 'Custom style packs', 'API access', 'Faster queue'],
      cta: 'Go Studio',
    },
  ] as const

  const [annual, setAnnual] = useState(true)
  const priceLabel = (p: number) => {
    if (p === 0) return '$0'
    const monthly = annual ? Math.round(p * 12 * 0.8) / 12 : p
    return `$${annual ? monthly.toFixed(2) : p}/mo`
  }

  return (
    <div className="space-y-10">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">Pricing</h1>
          <p className="text-black/70 mt-4 text-2xl">Pick a plan that fits your production needs.</p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-black/15 px-2 py-1 bg-white">
            <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm ${!annual ? 'bg-black text-white' : 'text-black'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm ${annual ? 'bg-black text-white' : 'text-black'}`}>Annual <span className="ml-1 text-[10px] align-middle px-1 rounded bg-black text-white">-20%</span></button>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i * 80}>
            <div className={`card rounded-xl border bg-white p-7 relative ${t.highlight ? 'border-black shadow-[0_12px_28px_rgba(0,0,0,.14)]' : 'border-black/20'}`}>
              {t.highlight && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/20 bg-black text-white text-xs leading-none shadow-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.3l-5.4 3.2 1.5-6.1-4.7-4 6.2-.5L12 4l2.4 5.9 6.2.5-4.7 4 1.5 6.1z"/></svg>
                    Popular
                  </span>
                </div>
              )}
              <div className="text-xl font-medium">{t.name}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-4xl font-bold">{priceLabel(t.price)}</div>
                {annual && t.price > 0 && <div className="text-xs text-black/60">billed annually</div>}
              </div>
              <ul className="mt-5 space-y-2 text-base text-black/80">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-black" />{f}</li>
                ))}
              </ul>
              <button className="mt-7 w-full px-5 py-3 rounded-md bg-black text-white">{t.cta}</button>
            </div>
          </Reveal>
        ))}
      </div>

      <section className="rounded-xl border border-black/20 bg-black/5 p-6">
        <div className="text-2xl mb-4">Frequently asked</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{q:'Can I render without watermark?',a:'Yes, Creator and Studio plans remove watermarks.'},{q:'Do you support team seats?',a:'Studio includes collaboration and roles.'},{q:'Is there an API?',a:'Yes, Studio exposes REST endpoints for automation.'},{q:'Can I cancel anytime?',a:'Yes, plans can be cancelled anytime; access continues until the period ends.'}].map((f,i)=> (
            <Reveal key={f.q} delay={i*60}>
              <div className="rounded-lg border border-black/20 bg-white p-5">
                <div className="text-lg">{f.q}</div>
                <div className="text-black/70 mt-1">{f.a}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <div className="rounded-xl border border-black/20 bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-2xl">Ready to animate?</div>
            <div className="text-black/70 text-lg">Start free, upgrade when you need higher quality or speed.</div>
          </div>
          <div className="flex gap-3 md:justify-end">
            <a href="/" className="px-5 py-3 rounded-md border border-black/15 hover:bg-black/5">Try free</a>
            <a href="/pricing" className="px-5 py-3 rounded-md bg-black text-white">Go Pro</a>
          </div>
        </div>
      </Reveal>
    </div>
  )
}


