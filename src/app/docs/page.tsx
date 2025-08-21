import Reveal from '@/components/Reveal'

export default function DocsPage() {
  return (
    <div className="space-y-10">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">Docs</h1>
          <p className="text-black/70 mt-4 text-2xl">Get started with AnimateStory.</p>
        </div>
      </Reveal>

      <section className="rounded-xl border border-black/20 bg-white p-6">
        <div className="text-2xl mb-3">Quick start</div>
        <ol className="list-decimal pl-5 space-y-2 text-black/80">
          <li>Open Home and create a project from your prompt.</li>
          <li>On the builder, generate Outline → Scenes → Dialogue.</li>
          <li>Render a draft, then refine dialogue and timings.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-black/20 bg-black/5 p-6">
        <div className="text-2xl mb-3">Concepts</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{t:'Acts',d:'Three-act structure for clarity.'},{t:'Scenes',d:'10–14 scenes per story.'},{t:'Shots',d:'2–4 shots per scene.'}].map((c,i)=> (
            <Reveal key={c.t} delay={i*80}>
              <div className="card rounded-lg border border-black/20 bg-white p-5">
                <div className="text-xl mb-1">{c.t}</div>
                <div className="text-black/70">{c.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}


