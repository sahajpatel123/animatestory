"use client"
import { useEffect, useState } from 'react'
import SceneCard from './SceneCard'
import DialogueEditor from './DialogueEditor'
import ProgressBar from './ProgressBar'

type Scene = {
  index: number
  title: string
  mood: string
  targetMs: number
  shots: Array<{ index: number; durationMs: number; camera: string; backgroundPrompt: string; caption: string }>
}

export default function SceneBoard({ projectId }: { projectId: string }) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [progress, setProgress] = useState<{ state: string; pct: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      const outline = await fetch('/api/generate/outline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) }).then(r => r.json())
      setProgress(outline.progress)
      const scenesRes = await fetch('/api/generate/scenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) }).then(r => r.json())
      setScenes(scenesRes.scenes)
      setProgress(scenesRes.progress)
      const dialogueRes = await fetch('/api/generate/dialogue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) }).then(r => r.json())
      setProgress(dialogueRes.progress)
    })()
  }, [projectId])

  async function onRender() {
    const resp = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) }).then(r => r.json())
    setProgress({ state: 'render', pct: 100 })
  }

  return (
    <div className="space-y-6">
      {progress && <ProgressBar pct={progress.pct} state={progress.state} />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenes.map((s) => (
          <SceneCard key={s.index} scene={s} />
        ))}
      </div>
      <DialogueEditor projectId={projectId} />
      <button onClick={onRender} className="px-6 py-3 bg-black text-white rounded-md">Render Draft</button>
    </div>
  )
}


