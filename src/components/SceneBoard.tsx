"use client"
import { useEffect, useMemo, useState } from 'react'
import SceneCard from './SceneCard'
import ProgressBar from './ProgressBar'
import Link from 'next/link'

type PlanScene = { id: string; title: string; shots: Array<{ id: string; durationMs?: number }>; lines: Array<{ id: string; who: string; text: string; estMs: number }> }

export default function SceneBoard({ projectId }: { projectId: string }) {
  const [plan, setPlan] = useState<{ targetSec: number; scenes: PlanScene[] } | null>(null)
  const [render, setRender] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const s = await fetch(`/api/project/status?id=${projectId}`).then(r => r.json()).catch(() => null)
      if (!cancelled && s?.ok) {
        setPlan(s.plan || null)
        setRender(s.render || null)
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [projectId])

  async function onRender(regenerate = false) {
    setBusy(true)
    try { await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, regenerate }) }) } finally { setBusy(false) }
  }

  const doneCount = useMemo(() => (render?.scenes?.length ? render.scenes.length : 0), [render])
  const total = plan?.scenes?.length || 0
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ProgressBar pct={pct} state={pct === 100 ? 'render' : 'assets'} />
        {render?.finalUrl && (
          <Link href={`/watch/${projectId}`} className="px-3 py-1.5 border border-black rounded-md text-sm">Open Player</Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(plan?.scenes || []).map((s, i) => {
          const r = render?.scenes?.[i]
          return (
            <div key={s.id} className="border border-black/20 rounded-lg p-4 bg-black/5">
              <div className="aspect-video mb-3 bg-white flex items-center justify-center overflow-hidden border border-black/10 rounded">
                {r?.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={s.title} src={r.thumbUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-black/40 text-sm">No thumbnail</div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-base font-medium">{s.title}</div>
                <div className={`text-xs px-2 py-0.5 rounded ${r ? 'bg-black text-white' : 'bg-black/10 text-black'}`}>{r ? 'done' : 'queued'}</div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => onRender(true)} disabled={busy} className="px-3 py-1.5 text-sm border border-black rounded-md disabled:opacity-50">Regenerate scene</button>
                <button disabled className="px-3 py-1.5 text-sm border border-black/30 rounded-md opacity-50 cursor-not-allowed">Cancel</button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onRender(false)} disabled={busy} className="px-6 py-3 bg-black text-white rounded-md disabled:opacity-50">Render Draft</button>
        <button onClick={() => onRender(true)} disabled={busy} className="px-6 py-3 border border-black rounded-md disabled:opacity-50">Force Fresh</button>
      </div>
    </div>
  )
}


