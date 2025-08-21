"use client"
import { useEffect, useState } from 'react'

export default function Player({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    // For MVP, poll a placeholder endpoint to get last render URL
    let cancelled = false
    ;(async () => {
      const res = await fetch(`/api/project/rendered?id=${projectId}`).then(r => r.json()).catch(() => null)
      if (!cancelled && res?.url) setUrl(res.url)
    })()
    return () => { cancelled = true }
  }, [projectId])

  if (!url) return <div className="text-black/60">No render available yet.</div>
  return (
    <video controls className="w-full rounded border border-black" src={url} />
  )
}


