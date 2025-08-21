type Scene = {
  index: number
  title: string
  mood: string
  targetMs: number
  shots: Array<{ index: number; durationMs: number; camera: string; backgroundPrompt: string; caption: string }>
}

export default function SceneCard({ scene }: { scene: Scene }) {
  return (
    <div className="border border-black/20 rounded-lg p-4 bg-black/5 hover:bg-black/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium tracking-[0.2px]">{scene.title}</div>
        <div className="text-sm text-black/60">{Math.round(scene.targetMs/1000)}s</div>
      </div>
      <div className="text-sm text-black/70 mb-3">Mood: {scene.mood}</div>
      <div className="space-y-1.5">
        {scene.shots.map(sh => (
          <div key={sh.index} className="text-base flex justify-between">
            <div>#{sh.index+1} {sh.camera}</div>
            <div>{Math.round(sh.durationMs/1000)}s</div>
          </div>
        ))}
      </div>
    </div>
  )
}


