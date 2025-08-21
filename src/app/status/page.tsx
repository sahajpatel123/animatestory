import Reveal from '@/components/Reveal'

export default function StatusPage() {
  const states = [
    { s: 'outline', pct: 10 },
    { s: 'scenes', pct: 25 },
    { s: 'dialogue', pct: 40 },
    { s: 'assets', pct: 65 },
    { s: 'audio', pct: 85 },
    { s: 'render', pct: 100 },
  ]

  return (
    <div className="space-y-10">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">Status</h1>
          <p className="text-black/70 mt-4 text-2xl">System and job status.</p>
        </div>
      </Reveal>

      <section className="rounded-xl border border-black/20 bg-white p-6">
        <div className="text-2xl mb-3">Render stages</div>
        <div className="space-y-3">
          {states.map((r) => (
            <div key={r.s}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="capitalize">{r.s}</div>
                <div>{r.pct}%</div>
              </div>
              <div className="h-2 rounded bg-black/10 overflow-hidden">
                <div className="h-full bg-black transition-[width] duration-500" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


