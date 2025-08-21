import Reveal from '@/components/Reveal'

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">About</h1>
          <p className="text-black/80 max-w-3xl text-2xl leading-relaxed mt-4">
            AnimateStory is a minimal animation studio for pixel‑perfect stories. We turn prompts into structured
            three‑act shorts with scenes, shots, voice, and clean renders.
          </p>
        </div>
      </Reveal>

      <section className="rounded-xl border border-black/20 bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Reveal>
          <div>
            <div className="text-2xl mb-2">Our mission</div>
            <div className="text-black/80 text-lg leading-relaxed">
              Make cinematic storytelling accessible. Whether you are a solo creator, educator, or studio, we help you
              prototype, iterate, and publish animated shorts in minutes—not weeks.
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="rounded-lg border border-black/20 bg-black/5 p-5">
            <div className="text-lg">Principles</div>
            <ul className="mt-2 space-y-2 text-black/80">
              <li>• Structure over spectacle</li>
              <li>• Consistency in characters and voice</li>
              <li>• Clear audio and legible captions</li>
              <li>• Performance and reliability</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Narrative Engine', desc: '3 acts, 10–14 scenes, runtime fitting within ±10%.' },
          { title: 'Audio Studio', desc: 'Voices, SFX, and music with smart ducking and LUFS checks.' },
          { title: 'Render Pipeline', desc: 'ffmpeg-driven MP4 + HLS for smooth playback and sharing.' },
        ].map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <div className="card rounded-xl border border-black/20 bg-white p-6">
              <div className="text-2xl mb-2">{c.title}</div>
              <div className="text-black/80 text-lg leading-relaxed">{c.desc}</div>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="rounded-xl border border-black/20 bg-black/5 p-6">
        <div className="text-2xl mb-4">Milestones</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { h: 'Q1', t: 'MVP', d: 'Prompt → Outline → Scenes → Dialogue → Render.' },
            { h: 'Q2', t: 'Assets', d: 'Cached backgrounds, character palettes, and poses.' },
            { h: 'Q3', t: 'Collab', d: 'Teams, versioning, and review notes.' },
          ].map((m, i) => (
            <Reveal key={m.t} delay={i * 80}>
              <div className="rounded-lg border border-black/20 bg-white p-5">
                <div className="text-sm text-black/60">{m.h}</div>
                <div className="text-xl">{m.t}</div>
                <div className="text-black/80 mt-1">{m.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-black/20 bg-white p-6">
        <div className="text-2xl mb-4">Team</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: 'Maya', r: 'Design', q: 'Style packs and captions that read well.' },
            { n: 'Leo', r: 'Engineering', q: 'Runtime fitter and render pipeline.' },
            { n: 'Ava', r: 'Audio', q: 'Voices, music, and clean mixes.' },
          ].map((p, i) => {
            const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(p.n)}&size=96&backgroundType=gradientLinear&backgroundColor=ffffff`
            return (
              <Reveal key={p.n} delay={i * 80}>
                <div className="card rounded-xl border border-black/20 bg-black/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={avatar} alt={p.n} className="h-12 w-12 rounded-full border border-black/20 bg-white" />
                    <div>
                      <div className="text-lg font-medium">{p.n}</div>
                      <div className="text-xs text-black/60">{p.r}</div>
                    </div>
                  </div>
                  <div className="text-black/80">“{p.q}”</div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      <Reveal>
        <div className="rounded-xl border border-black/20 bg-white p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-2xl">Build something memorable</div>
            <div className="text-black/70 text-lg">From a sentence to a short: try AnimateStory and share your vision.</div>
          </div>
          <div className="flex gap-3 md:justify-end">
            <a href="/" className="px-5 py-3 rounded-md border border-black/15 hover:bg-black/5">Get started</a>
            <a href="/pricing" className="px-5 py-3 rounded-md bg-black text-white">View pricing</a>
          </div>
        </div>
      </Reveal>
    </div>
  )
}


