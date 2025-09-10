"use client"
import { useEffect, useMemo, useRef, useState } from 'react'

export default function Player({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchStatus() {
      const s = await fetch(`/api/project/status?id=${projectId}`).then(r => r.json()).catch(() => null)
      if (!cancelled && s?.ok) setStatus(s.render || null)
    }
    fetchStatus()
    const t = setInterval(fetchStatus, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [projectId])

  useEffect(() => {
    (async () => {
      if (!status?.hlsUrl || !videoRef.current) return
      try {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.attachMedia(videoRef.current)
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(status.hlsUrl)
          })
        } else {
          // Fallback if native playback supports HLS (Safari)
          videoRef.current.src = status.hlsUrl
        }
      } catch {}
    })()
  }, [status?.hlsUrl])

  const chapters = useMemo(() => status?.chapters || [], [status])

  if (!status?.hlsUrl && !status?.finalUrl) return <div className="text-black/60">No render available yet.</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-start">
      <div>
        <video ref={videoRef} controls className="w-full rounded border border-black" src={status?.finalUrl || undefined} />
      </div>
      <aside className="border border-black/10 rounded p-3 bg-black/5">
        <div className="text-sm font-medium mb-2">Chapters</div>
        <ol className="space-y-1 text-sm">
          {chapters.map((c: any, i: number) => (
            <li key={i}>
              <button
                className="w-full text-left px-2 py-1 rounded hover:bg-black/10"
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = (c.startMs || 0) / 1000 }}
              >
                {c.sceneId} — {Math.round((c.startMs||0)/1000)}s
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}


