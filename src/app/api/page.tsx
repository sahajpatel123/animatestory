import Reveal from '@/components/Reveal'

export default function ApiPage() {
  return (
    <div className="space-y-10">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">API</h1>
          <p className="text-black/70 mt-4 text-2xl">REST endpoints for automation.</p>
        </div>
      </Reveal>

      <section className="rounded-xl border border-black/20 bg-white p-6">
        <div className="text-2xl mb-3">Endpoints</div>
        <ul className="space-y-3 text-black/80">
          <li><code className="px-2 py-1 bg-black/5 rounded">POST /api/project</code> Create project</li>
          <li><code className="px-2 py-1 bg-black/5 rounded">POST /api/generate/outline</code> Generate outline</li>
          <li><code className="px-2 py-1 bg-black/5 rounded">POST /api/generate/scenes</code> Generate scenes</li>
          <li><code className="px-2 py-1 bg-black/5 rounded">POST /api/generate/dialogue</code> Generate dialogue</li>
          <li><code className="px-2 py-1 bg-black/5 rounded">POST /api/render</code> Enqueue render</li>
          <li><code className="px-2 py-1 bg-black/5 rounded">GET /api/status/:jobId</code> Job status</li>
        </ul>
      </section>
    </div>
  )
}


