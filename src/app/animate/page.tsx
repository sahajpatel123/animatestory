"use client"
import SceneBoard from '@/components/SceneBoard'
import Reveal from '@/components/Reveal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AnimatePage() {
  // Note: In a full app, you'd create a project then route /project/[id]. For demo, show builder shell.
  const router = useRouter()
  return (
    <div className="space-y-10">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">Animate</h1>
          <p className="text-black/80 text-2xl mt-4">Generate outline, scenes, dialogue, and render your animated story.
          </p>
          <div className="mt-6">
            <button onClick={() => router.push('/create')} className="px-6 py-3 rounded-md bg-black text-white text-lg">Create a project</button>
          </div>
        </div>
      </Reveal>

      <section className="rounded-xl border border-black/20 bg-black/5 p-6">
        <div className="text-2xl mb-4">Builder pipeline</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { t: 'Outline', d: '10–14 beats across 3 acts to define story flow.' },
            { t: 'Scenes', d: 'Expand beats into scenes with 2–4 shots each.' },
            { t: 'Dialogue', d: 'Concise lines and captions, validated for timing.' },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <div className="card rounded-xl border border-black/20 bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 grid place-items-center rounded-md bg-black text-white">
                    {/* icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 4h14v2H5V4zm0 7h14v2H5v-2zm0 7h14v2H5v-2z"/></svg>
                  </div>
                  <div className="text-xl font-medium">{c.t}</div>
                </div>
                <div className="text-black/70 text-lg leading-relaxed">{c.d}</div>
                <div className="mt-4">
                  <button className="px-4 py-2 rounded-md border border-black/15 hover:bg-black/5">Generate</button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6">
        <div className="text-2xl mb-4">Render status</div>
        <div className="space-y-3">
          {[
            { s: 'outline', pct: 10 },
            { s: 'scenes', pct: 25 },
            { s: 'dialogue', pct: 40 },
            { s: 'assets', pct: 65 },
            { s: 'audio', pct: 85 },
            { s: 'render', pct: 100 },
          ].map((r) => (
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
        <div className="mt-5">
          <button className="px-5 py-2.5 bg-black text-white rounded-md">Render draft</button>
        </div>
      </section>

      <section className="rounded-xl border border-black/20 bg-black/5 p-6">
        <div className="text-2xl mb-4">Tips</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: 'Keep prompts tight', d: 'Aim for one sentence that sets place, goal, and tone.' },
            { t: 'Use consistent names', d: 'Lock your characters early for voice and palette consistency.' },
            { t: 'Mind pacing', d: 'Target 240s; the fitter will scale shots to stay within ±10%.' },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <div className="card rounded-lg border border-black/20 bg-white p-5">
                <div className="text-xl mb-1">{c.t}</div>
                <div className="text-black/70 text-lg leading-relaxed">{c.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}


